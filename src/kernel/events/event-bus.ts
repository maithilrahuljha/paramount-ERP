/**
 * PMN ERP Platform - Event Bus
 * 
 * Central event bus for inter-module communication.
 * Implements publish-subscribe pattern with support for:
 * - Async event handlers
 * - Priority-based execution
 * - Event filtering
 * - Error handling and retries
 * - Event persistence for replay
 */

import { v4 as uuid } from 'uuid';
import type { ERPEvent, EventHandler, EventSubscription, EventMetadata } from '../types';

type EventStore = Map<string, ERPEvent[]>;
type SubscriptionStore = Map<string, EventSubscription[]>;

class EventBus {
  private static instance: EventBus;
  private subscriptions: SubscriptionStore = new Map();
  private eventHistory: EventStore = new Map();
  private maxHistorySize = 1000;

  private constructor() {}

  /**
   * Get singleton instance of EventBus
   */
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribe to an event type
   * @param eventType - Event type to subscribe to (supports wildcards)
   * @param handler - Handler function to execute
   * @param moduleId - ID of the subscribing module
   * @param priority - Execution priority (higher = earlier)
   * @returns Unsubscribe function
   */
  subscribe<T = unknown>(
    eventType: string,
    handler: EventHandler<T>,
    moduleId: string,
    priority: number = 0
  ): () => void {
    const subscription: EventSubscription = {
      eventType,
      handler: handler as EventHandler,
      moduleId,
      priority,
    };

    const existing = this.subscriptions.get(eventType) ?? [];
    existing.push(subscription);
    existing.sort((a, b) => b.priority - a.priority);
    this.subscriptions.set(eventType, existing);

    console.log(`[EventBus] Subscribed: ${moduleId} -> ${eventType}`);

    return () => {
      const subs = this.subscriptions.get(eventType);
      if (subs) {
        const index = subs.indexOf(subscription);
        if (index > -1) {
          subs.splice(index, 1);
          console.log(`[EventBus] Unsubscribed: ${moduleId} -> ${eventType}`);
        }
      }
    };
  }

  /**
   * Publish an event to all subscribers
   * @param type - Event type
   * @param payload - Event payload
   * @param source - Source module ID
   * @param metadata - Additional metadata
   */
  async publish<T = unknown>(
    type: string,
    payload: T,
    source: string,
    metadata: Partial<EventMetadata> = {}
  ): Promise<ERPEvent<T>> {
    const event: ERPEvent<T> = {
      id: uuid(),
      type,
      source,
      timestamp: new Date(),
      version: '1.0.0',
      correlationId: metadata.correlationId as string | undefined,
      causationId: metadata.causationId as string | undefined,
      payload,
      metadata: {
        ...metadata,
        traceId: (metadata.traceId as string) ?? uuid(),
      },
    };

    console.log(`[EventBus] Publishing: ${type} from ${source}`, { eventId: event.id });

    // Store event in history
    this.storeEvent(event);

    // Get all matching subscriptions
    const handlers = this.getMatchingSubscriptions(type);

    // Execute handlers
    const errors: Error[] = [];
    for (const subscription of handlers) {
      try {
        await subscription.handler(event as ERPEvent);
      } catch (error) {
        console.error(
          `[EventBus] Handler error in ${subscription.moduleId} for ${type}:`,
          error
        );
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }

    if (errors.length > 0) {
      console.warn(`[EventBus] ${errors.length} handler(s) failed for ${type}`);
    }

    return event;
  }

  /**
   * Get matching subscriptions for an event type
   * Supports wildcard patterns like "crm.*" or "*"
   */
  private getMatchingSubscriptions(eventType: string): EventSubscription[] {
    const result: EventSubscription[] = [];

    for (const [pattern, subscriptions] of this.subscriptions.entries()) {
      if (this.matchPattern(pattern, eventType)) {
        result.push(...subscriptions);
      }
    }

    return result.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Match event type against subscription pattern
   */
  private matchPattern(pattern: string, eventType: string): boolean {
    if (pattern === '*') return true;
    if (pattern === eventType) return true;
    
    if (pattern.endsWith('.*')) {
      const prefix = pattern.slice(0, -2);
      return eventType.startsWith(prefix + '.');
    }

    return false;
  }

  /**
   * Store event in history for replay capability
   */
  private storeEvent<T>(event: ERPEvent<T>): void {
    const events = this.eventHistory.get(event.type) ?? [];
    events.push(event as ERPEvent);
    
    // Limit history size
    if (events.length > this.maxHistorySize) {
      events.shift();
    }
    
    this.eventHistory.set(event.type, events);
  }

  /**
   * Get event history for a specific type
   */
  getHistory(eventType: string, limit: number = 100): ERPEvent[] {
    const events = this.eventHistory.get(eventType) ?? [];
    return events.slice(-limit);
  }

  /**
   * Clear all subscriptions (useful for testing)
   */
  clearSubscriptions(): void {
    this.subscriptions.clear();
    console.log('[EventBus] All subscriptions cleared');
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory.clear();
    console.log('[EventBus] Event history cleared');
  }

  /**
   * Get subscription count for debugging
   */
  getSubscriptionCount(): number {
    let count = 0;
    for (const subs of this.subscriptions.values()) {
      count += subs.length;
    }
    return count;
  }
}

// Export singleton instance
export const eventBus = EventBus.getInstance();

// Export convenience functions
export function subscribe<T = unknown>(
  eventType: string,
  handler: EventHandler<T>,
  moduleId: string,
  priority: number = 0
): () => void {
  return eventBus.subscribe(eventType, handler, moduleId, priority);
}

export function publish<T = unknown>(
  type: string,
  payload: T,
  source: string,
  metadata: Partial<EventMetadata> = {}
): Promise<ERPEvent<T>> {
  return eventBus.publish(type, payload, source, metadata);
}
