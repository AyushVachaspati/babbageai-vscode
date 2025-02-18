// Original file: proto/model_config.proto

import type { Long } from '@grpc/proto-loader';

// Original file: proto/model_config.proto

export const _inference_ModelQueuePolicy_TimeoutAction = {
  REJECT: 'REJECT',
  DELAY: 'DELAY',
} as const;

export type _inference_ModelQueuePolicy_TimeoutAction =
  | 'REJECT'
  | 0
  | 'DELAY'
  | 1

export type _inference_ModelQueuePolicy_TimeoutAction__Output = typeof _inference_ModelQueuePolicy_TimeoutAction[keyof typeof _inference_ModelQueuePolicy_TimeoutAction]

export interface ModelQueuePolicy {
  'timeout_action'?: (_inference_ModelQueuePolicy_TimeoutAction);
  'default_timeout_microseconds'?: (number | string | Long);
  'allow_timeout_override'?: (boolean);
  'max_queue_size'?: (number);
}

export interface ModelQueuePolicy__Output {
  'timeout_action': (_inference_ModelQueuePolicy_TimeoutAction__Output);
  'default_timeout_microseconds': (string);
  'allow_timeout_override': (boolean);
  'max_queue_size': (number);
}
