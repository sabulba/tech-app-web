export class RobotEndpoints {
  // ***********Cmd Guids*************/
  static readonly CMD_SERVICE_GUID = 'f1d19eaf-37a1-48c2-b226-e9f9e817ccb0';
  static readonly CMD_PHASING_CHARACTERISTIC_GUID = 'f1d19eaf-37a1-48c2-b226-e9f9e817ccb1';
  static readonly CMD_HOMING_PER_AXES_CHARACTERISTIC_GUID = 'f1d19eaf-37a1-48c2-b226-e9f9e817ccb2';
  static readonly CMD_MOVE_CHARACTERISTIC_GUID = 'f1d19eaf-37a1-48c2-b226-e9f9e817ccb3';
  static readonly CMD_MOVE_REPEAT_CHARACTERISTIC_GUID = 'f1d19eaf-37a1-48c2-b226-e9f9e817ccb4';
  static readonly CMD_MOTOR_CHARACTERISTIC_GUID = 'f1d19eaf-37a1-48c2-b226-e9f9e817ccb5';
  static readonly CMD_STOP_MOVE_CHARACTERISTIC_GUID = 'f1d19eaf-37a1-48c2-b226-e9f9e817ccb6';
  static readonly CMD_GRIPPER_CHARACTERISTIC_GUID = 'f1d19eaf-37a1-48c2-b226-e9f9e817ccb7';
  static readonly CMD_ASSIGN_TASK_TO_ROBOT_CHARACTERISTIC_GUID = 'f1d19eaf-37a1-48c2-b226-e9f9e817ccb8';
  static readonly CMD_PREPARE_FOR_MAPPING_CHARACTERISTIC_GUID = 'f1d19eaf-37a1-48c2-b226-e9f9e817ccb9';
  static readonly CMD_HOMING_CHARACTERISTIC_GUID = 'f1d19eaf-37a1-48c2-b226-e9f9e817ccc0';
  static readonly CMD_STOP_TASK_CHARACTERISTIC_GUID = 'f1d19eaf-37a1-48c2-b226-e9f9e817ccc1';
  static readonly CMD_ROBOT_EXERCISE_CHARACTERISTIC_GUID = 'f1d19eaf-37a1-48c2-b226-e9f9e817ccc2';
  static readonly CMD_GRIPPER_REPEAT_CHARACTERISTIC_GUID = 'f1d19eaf-37a1-48c2-b226-e9f9e817ccc3';
  static readonly CMD_WASH_GUID = 'f1d19eaf-37a1-48c2-b226-e9f9e817ccc5';
  static readonly CMD_ASSUME_WASH_POINT_POSITION_GUID = 'f1d19eaf-37a1-48c2-b226-e9f9e817ccc6';
  static readonly CMD_WASH_SENSOR_MAPPING_GUID = 'f1d19eaf-37a1-48c2-b226-e9f9e817ccc7';
  static readonly CMD_TAKE_RETURN_REPEAT_CHARACTERISTIC_GUID = 'f1d19eaf-37a1-48c2-b226-e9f9e817ccc8';
  static readonly CMD_CHECK_LED_CHARACTERISTIC_GUID = 'f1d19eaf-37a1-48c2-b226-e9f9e817ccc9';
  static readonly CMD_PREPARE_FOR_MAPPING_FOR_TESTING_GUID = 'f1d19eaf-37a1-48c2-b226-e9f9e817ccca';
  static readonly CMD_PREPARE_FOR_ROBOT_TEST_FOR_TESTING_GUID = 'f1d19eaf-37a1-48c2-b226-e9f9e817cccb';
  static readonly CMD_MULTI_AXIS_MOVE_FOR_TESTING_GUID = 'f1d19eaf-37a1-48c2-b226-e9f9e817cccc';

  // ***********Set Guids*************/
  static readonly SET_SERVICE_GUID = 'd4723a2d-37c8-4197-8a4b-3974084cd054';
  static readonly SET_GRIPPER_PWM_CHARACTERISTIC_GUID = 'd4723a2d-37c8-4197-8a4b-3974084cd055';
  static readonly SET_ROLE_ASSIGNMENT_CHARACTERISTIC_GUID = 'd4723a2d-37c8-4197-8a4b-3974084cd056';
  static readonly SET_DEFAULT_MOTION_PARAMS_CHARACTERISTIC_GUID = 'd4723a2d-37c8-4197-8a4b-3974084cd057';
  static readonly SET_IS_NEGATIVE_CHARACTERISTIC_GUID = 'd4723a2d-37c8-4197-8a4b-3974084cd058';
  static readonly SET_STATION_NUMBER_CHARACTERISTIC_GUID = 'd4723a2d-37c8-4197-8a4b-3974084cd059';
  static readonly SET_PLATFORM_MAP1_CHARACTERISTIC_GUID = 'd4723a2d-37c8-4197-8a4b-3974084cd060';
  static readonly SET_PLATFORM_MAP2_CHARACTERISTIC_GUID = 'd4723a2d-37c8-4197-8a4b-3974084cd061';

  // ***********Get Guids*************/
  static readonly GET_SERVICE_GUID_PREFIX = '5c3b4a45-41a2-4d28-afc6-b593a85a3580';
  static readonly GET_STATUS_CHARACTERISTIC_GUID = '5c3b4a45-41a2-4d28-afc6-b593a85a3583';
  static readonly GET_ROLE_ASSIGNMENT_CHARACTERISTIC_GUID = '5c3b4a45-41a2-4d28-afc6-b593a85a3584';
  static readonly GET_BOTH_GRIPPER_PWM_CHARACTERISTIC_GUID = '5c3b4a45-41a2-4d28-afc6-b593a85a3585';
  static readonly GET_UPPER_GRIPPER_PWM_CHARACTERISTIC_GUID = '5c3b4a45-41a2-4d28-afc6-b593a85a3586';
  static readonly GET_LOWER_GRIPPER_PWM_CHARACTERISTIC_GUID = '5c3b4a45-41a2-4d28-afc6-b593a85a3587';
  static readonly GET_MOTION_PARAM_CHARACTERISTIC_GUID = '5c3b4a45-41a2-4d28-afc6-b593a85a3588';
  static readonly GET_SET_CURRENT_TASK_STATE_STATUS_CHARACTERISTIC_GUID = '5c3b4a45-41a2-4d28-afc6-b593a85a3589';
}

export enum RobotTaskType {
  Unknown = 0,
  GoingToStall = 1,
  GoingToParking = 2,
  Attaching = 3,
  StoppingMotion = 5,
  GoingToBrushStation = 6,
  TakeBrusher = 7,
  ReturnBrusher = 8,
  Brush = 9,
  GoingToDipperStation = 10,
  TakeDipper = 11,
  ReturnDipper = 12,
  Dip = 13,
  DoHoming = 14,
  AssumeBasePosition = 15,
  PrepareForHoming = 16,
  /** @deprecated Use RobotTaskSetMotorsStateForTesting instead */
  TurnXMotorOff = 17,
  TakeCupsForTesting = 18,
  ReleaseGrippersForTesting = 19,
  MoveArmToCameraSprayPositionForTesting = 20,
  MoveArmToBrusherSprayPositionForTesting = 21,
  SetGrippersStateForTesting = 22,
  /** @deprecated Use RobotTaskMovePtpForTesting instead */
  MoveZUpForTesting = 23,
  /** @deprecated Use RobotTaskMovePtpForTesting instead */
  MoveZDownForTesting = 24,
  /** @deprecated Use RobotTaskMovePtpForTesting instead */
  MoveYForwardForTesting = 25,
  /** @deprecated Use RobotTaskMovePtpForTesting instead */
  MoveYBackwardForTesting = 26,
  /** @deprecated Use RobotTaskMovePtpForTesting instead */
  MoveAxisForTesting = 27,
  /** @deprecated */
  MoveAxesRelativeForTesting = 28,
  SetMotorsStateForTesting = 29,
  /** @deprecated Use RobotTaskHomePerAxisForTesting instead */
  HomeArmForTesting = 30,
  FoldArmForTesting = 31,
  SetRollBrushesStateForTesting = 32,
  PrepareForMappingForTesting = 33,
  LearnLocationForTesting = 34,
  HomePerAxisForTesting = 35,
  /** @deprecated Use RobotTaskPhaseAxesForTesting instead */
  PhasingPerAxisForTesting = 36,
  GoingToWashStation = 37,
  AssumeWashSensorMappingPosForTesting = 38,
  AssumeWashStepForTesting = 39,
  Wash = 40,
  /** @deprecated Should be deleted */
  MoveInStallForTesting = 41,
  /** @deprecated To be deleted */
  TakeLeftCupsPairForTesting = 42,
  /** @deprecated To be deleted */
  TakeRightCupsPairForTesting = 43,
  RobotTaskMovePtpForTesting = 44,
  SetTrackModeEnableForTesting = 45,
  RobotTaskPhaseAxesForTesting = 46,
  RobotTaskResetMotionControllerForTesting = 47,
  PrepareForRobotTestsForTesting = 48,
  /** @deprecated To be deleted */
  LearnToolInHandForTesting = 49,
  RepeatMotionForTesting = 50,
  MoveOnPathForTesting = 51,
  RepeatSetGrippersStateForTesting = 52,
  SetRobotLedIndicationForTesting = 53,
  SetTrolleyParametersForTesting = 54,
  SetGrippersCalibrationForTesting = 55,
  SetRubOutputForTesting = 56,
  ReleaseTool = 57,
  SetProductionInfoForTesting = 58,
  MilkerWarmupForTesting = 59
}

export interface AssignTaskToRobotCmd {
  LocationId: number;
  TaskType: number; // Numeric index of RobotTaskType
}

export enum MotorType {
  A = 0,
  B = 1,
  C = 2,
  All = 3,
  ArmOnly = 4
}

export interface MotorStopCmd {
  motor: number; // Numeric value of MotorType
}
