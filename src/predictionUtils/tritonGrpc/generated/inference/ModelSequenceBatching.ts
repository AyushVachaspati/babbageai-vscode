// Original file: proto/model_config.proto

import type { DataType as _inference_DataType, DataType__Output as _inference_DataType__Output } from '../inference/DataType';
import type { Long } from '@grpc/proto-loader';

export interface _inference_ModelSequenceBatching_Control {
  'kind'?: (_inference_ModelSequenceBatching_Control_Kind);
  'int32_false_true'?: (number)[];
  'fp32_false_true'?: (number | string)[];
  'bool_false_true'?: (boolean)[];
  'data_type'?: (_inference_DataType);
}

export interface _inference_ModelSequenceBatching_Control__Output {
  'kind': (_inference_ModelSequenceBatching_Control_Kind__Output);
  'int32_false_true': (number)[];
  'fp32_false_true': (number)[];
  'bool_false_true': (boolean)[];
  'data_type': (_inference_DataType__Output);
}

export interface _inference_ModelSequenceBatching_ControlInput {
  'name'?: (string);
  'control'?: (_inference_ModelSequenceBatching_Control)[];
}

export interface _inference_ModelSequenceBatching_ControlInput__Output {
  'name': (string);
  'control': (_inference_ModelSequenceBatching_Control__Output)[];
}

export interface _inference_ModelSequenceBatching_InitialState {
  'data_type'?: (_inference_DataType);
  'dims'?: (number | string | Long)[];
  'zero_data'?: (boolean);
  'data_file'?: (string);
  'name'?: (string);
  'state_data'?: "zero_data"|"data_file";
}

export interface _inference_ModelSequenceBatching_InitialState__Output {
  'data_type': (_inference_DataType__Output);
  'dims': (string)[];
  'zero_data'?: (boolean);
  'data_file'?: (string);
  'name': (string);
  'state_data': "zero_data"|"data_file";
}

// Original file: proto/model_config.proto

export const _inference_ModelSequenceBatching_Control_Kind = {
  CONTROL_SEQUENCE_START: 'CONTROL_SEQUENCE_START',
  CONTROL_SEQUENCE_READY: 'CONTROL_SEQUENCE_READY',
  CONTROL_SEQUENCE_END: 'CONTROL_SEQUENCE_END',
  CONTROL_SEQUENCE_CORRID: 'CONTROL_SEQUENCE_CORRID',
} as const;

export type _inference_ModelSequenceBatching_Control_Kind =
  | 'CONTROL_SEQUENCE_START'
  | 0
  | 'CONTROL_SEQUENCE_READY'
  | 1
  | 'CONTROL_SEQUENCE_END'
  | 2
  | 'CONTROL_SEQUENCE_CORRID'
  | 3

export type _inference_ModelSequenceBatching_Control_Kind__Output = typeof _inference_ModelSequenceBatching_Control_Kind[keyof typeof _inference_ModelSequenceBatching_Control_Kind]

export interface _inference_ModelSequenceBatching_State {
  'input_name'?: (string);
  'output_name'?: (string);
  'data_type'?: (_inference_DataType);
  'dims'?: (number | string | Long)[];
  'initial_state'?: (_inference_ModelSequenceBatching_InitialState)[];
}

export interface _inference_ModelSequenceBatching_State__Output {
  'input_name': (string);
  'output_name': (string);
  'data_type': (_inference_DataType__Output);
  'dims': (string)[];
  'initial_state': (_inference_ModelSequenceBatching_InitialState__Output)[];
}

export interface _inference_ModelSequenceBatching_StrategyDirect {
  'max_queue_delay_microseconds'?: (number | string | Long);
  'minimum_slot_utilization'?: (number | string);
}

export interface _inference_ModelSequenceBatching_StrategyDirect__Output {
  'max_queue_delay_microseconds': (string);
  'minimum_slot_utilization': (number);
}

export interface _inference_ModelSequenceBatching_StrategyOldest {
  'max_candidate_sequences'?: (number);
  'preferred_batch_size'?: (number)[];
  'max_queue_delay_microseconds'?: (number | string | Long);
}

export interface _inference_ModelSequenceBatching_StrategyOldest__Output {
  'max_candidate_sequences': (number);
  'preferred_batch_size': (number)[];
  'max_queue_delay_microseconds': (string);
}

export interface ModelSequenceBatching {
  'max_sequence_idle_microseconds'?: (number | string | Long);
  'control_input'?: (_inference_ModelSequenceBatching_ControlInput)[];
  'direct'?: (_inference_ModelSequenceBatching_StrategyDirect | null);
  'oldest'?: (_inference_ModelSequenceBatching_StrategyOldest | null);
  'state'?: (_inference_ModelSequenceBatching_State)[];
  'strategy_choice'?: "direct"|"oldest";
}

export interface ModelSequenceBatching__Output {
  'max_sequence_idle_microseconds': (string);
  'control_input': (_inference_ModelSequenceBatching_ControlInput__Output)[];
  'direct'?: (_inference_ModelSequenceBatching_StrategyDirect__Output | null);
  'oldest'?: (_inference_ModelSequenceBatching_StrategyOldest__Output | null);
  'state': (_inference_ModelSequenceBatching_State__Output)[];
  'strategy_choice': "direct"|"oldest";
}
