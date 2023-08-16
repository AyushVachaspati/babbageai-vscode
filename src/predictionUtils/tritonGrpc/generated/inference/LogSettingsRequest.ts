// Original file: proto/grpc_service.proto


export interface _inference_LogSettingsRequest_SettingValue {
  'bool_param'?: (boolean);
  'uint32_param'?: (number);
  'string_param'?: (string);
  'parameter_choice'?: "bool_param"|"uint32_param"|"string_param";
}

export interface _inference_LogSettingsRequest_SettingValue__Output {
  'bool_param'?: (boolean);
  'uint32_param'?: (number);
  'string_param'?: (string);
  'parameter_choice': "bool_param"|"uint32_param"|"string_param";
}

export interface LogSettingsRequest {
  'settings'?: ({[key: string]: _inference_LogSettingsRequest_SettingValue});
}

export interface LogSettingsRequest__Output {
  'settings': ({[key: string]: _inference_LogSettingsRequest_SettingValue__Output});
}
