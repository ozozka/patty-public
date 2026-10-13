import type { z } from 'zod';

import type {
  accountSchema,
  accountStatusSchema,
  changePasswordRequestSchema,
  emailVerifyPayloadSchema,
  forgotPasswordRequestSchema,
  locationHeartbeatRequestSchema,
  locationPrecisionSchema,
  loginRequestSchema,
  loginResponseSchema,
  phoneVerificationPayloadSchema,
  phoneVerificationRequestSchema,
  profileResponseSchema,
  publicProfileResponseSchema,
  registerRequestSchema,
  refreshTokenRequestSchema,
  refreshTokenResponseSchema,
  registerResponseSchema,
  resetPasswordRequestSchema,
  updatePushTokenRequestSchema,
  updateUserRequestSchema,
  verifyPasswordRequestSchema,
  verifyResetOtpRequestSchema,
} from './schemas/account';
import type {
  getMessagesParamsSchema,
  markReadRequestSchema,
  messageSendSchema,
  messageSchema,
  messageTypeSchema,
  messagesResponseSchema,
  repliedMessageSchema,
  unreadCountSchema,
} from './schemas/chat';
import type { cloudinarySignatureSchema, signatureRequestSchema } from './schemas/cloudinary';
import type { errorCodeSchema, errorResponseSchema } from './schemas/common';
import type {
  candidatesResponseSchema,
  getCandidatesParamsSchema,
  matchPreferencesSchema,
  matchSchema,
  swipeActionSchema,
  swipeRequestSchema,
  swipeResultSchema,
} from './schemas/matching';
import type {
  breedSchema,
  locationLevelSchema,
  locationSchema,
  resolveLocationParamsSchema,
  speciesSchema,
  speciesWithBreedsSchema,
} from './schemas/metadata';
import type {
  blockUserRequestSchema,
  blockedUserSchema,
  createReportRequestSchema,
  reportReasonSchema,
  reportSchema,
  reportStatusSchema,
  reportTargetTypeSchema,
  userBlockSchema,
} from './schemas/moderation';
import type {
  addPetPhotoRequestSchema,
  petCandidateSchema,
  petGenderSchema,
  petPhotoSchema,
  petRequestSchema,
  petSchema,
  reorderPetPhotosRequestSchema,
} from './schemas/pet';
import type {
  wsErrorSchema,
  wsEventSchema,
  wsMatchCreatedSchema,
  wsMatchDeletedSchema,
  wsMessageReceiveSchema,
  wsMessageSendSchema,
  wsPresenceUpdateSchema,
  wsReadReceiptRelaySchema,
  wsReadReceiptSchema,
  wsTypingStartRelaySchema,
  wsTypingStartSchema,
  wsTypingStopRelaySchema,
  wsTypingStopSchema,
} from './schemas/ws';

// Account
export type AccountStatus = z.infer<typeof accountStatusSchema>;
export type LocationPrecision = z.infer<typeof locationPrecisionSchema>;
export type Account = z.infer<typeof accountSchema>;
export type ProfileResponse = z.infer<typeof profileResponseSchema>;
export type PublicProfileResponse = z.infer<typeof publicProfileResponseSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type RegisterResponse = z.infer<typeof registerResponseSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;
export type VerifyPasswordRequest = z.infer<typeof verifyPasswordRequestSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
export type EmailVerifyPayload = z.infer<typeof emailVerifyPayloadSchema>;
export type PhoneVerificationRequest = z.infer<typeof phoneVerificationRequestSchema>;
export type PhoneVerificationPayload = z.infer<typeof phoneVerificationPayloadSchema>;
export type UpdatePushTokenRequest = z.infer<typeof updatePushTokenRequestSchema>;
export type LocationHeartbeatRequest = z.infer<typeof locationHeartbeatRequestSchema>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenRequestSchema>;
export type RefreshTokenResponse = z.infer<typeof refreshTokenResponseSchema>;
export type VerifyResetOtpRequest = z.infer<typeof verifyResetOtpRequestSchema>;

// Pet
export type PetGender = z.infer<typeof petGenderSchema>;
export type PetPhoto = z.infer<typeof petPhotoSchema>;
export type Pet = z.infer<typeof petSchema>;
export type PetRequest = z.infer<typeof petRequestSchema>;
export type PetCandidate = z.infer<typeof petCandidateSchema>;
export type AddPetPhotoRequest = z.infer<typeof addPetPhotoRequestSchema>;
export type ReorderPetPhotosRequest = z.infer<typeof reorderPetPhotosRequestSchema>;

// Matching
export type SwipeAction = z.infer<typeof swipeActionSchema>;
export type SwipeRequest = z.infer<typeof swipeRequestSchema>;
export type SwipeResult = z.infer<typeof swipeResultSchema>;
export type Match = z.infer<typeof matchSchema>;
export type GetCandidatesParams = z.infer<typeof getCandidatesParamsSchema>;
export type MatchPreferences = z.infer<typeof matchPreferencesSchema>;
export type CandidatesResponse = z.infer<typeof candidatesResponseSchema>;

// Chat
export type MessageType = z.infer<typeof messageTypeSchema>;
export type RepliedMessage = z.infer<typeof repliedMessageSchema>;
export type Message = z.infer<typeof messageSchema>;
export type MessageSend = z.infer<typeof messageSendSchema>;
export type GetMessagesParams = z.infer<typeof getMessagesParamsSchema>;
export type MessagesResponse = z.infer<typeof messagesResponseSchema>;
export type MarkReadRequest = z.infer<typeof markReadRequestSchema>;
export type UnreadCount = z.infer<typeof unreadCountSchema>;

// Metadata
export type LocationLevel = z.infer<typeof locationLevelSchema>;
export type Location = z.infer<typeof locationSchema>;
export type Species = z.infer<typeof speciesSchema>;
export type Breed = z.infer<typeof breedSchema>;
export type SpeciesWithBreeds = z.infer<typeof speciesWithBreedsSchema>;
export type ResolveLocationParams = z.infer<typeof resolveLocationParamsSchema>;

// Moderation
export type ReportReason = z.infer<typeof reportReasonSchema>;
export type ReportStatus = z.infer<typeof reportStatusSchema>;
export type ReportTargetType = z.infer<typeof reportTargetTypeSchema>;
export type CreateReportRequest = z.infer<typeof createReportRequestSchema>;
export type BlockUserRequest = z.infer<typeof blockUserRequestSchema>;
export type UserBlock = z.infer<typeof userBlockSchema>;
export type BlockedUser = z.infer<typeof blockedUserSchema>;
export type Report = z.infer<typeof reportSchema>;

// Cloudinary
export type SignatureRequest = z.infer<typeof signatureRequestSchema>;
export type CloudinarySignature = z.infer<typeof cloudinarySignatureSchema>;

// Common
export type ErrorCode = z.infer<typeof errorCodeSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

// WebSocket
export type WsEvent = z.infer<typeof wsEventSchema>;
export type WsTypingStart = z.infer<typeof wsTypingStartSchema>;
export type WsTypingStop = z.infer<typeof wsTypingStopSchema>;
export type WsReadReceipt = z.infer<typeof wsReadReceiptSchema>;
export type WsMessageSend = z.infer<typeof wsMessageSendSchema>;
export type WsPresenceUpdate = z.infer<typeof wsPresenceUpdateSchema>;
export type WsMessageReceive = z.infer<typeof wsMessageReceiveSchema>;
export type WsReadReceiptRelay = z.infer<typeof wsReadReceiptRelaySchema>;
export type WsTypingStartRelay = z.infer<typeof wsTypingStartRelaySchema>;
export type WsTypingStopRelay = z.infer<typeof wsTypingStopRelaySchema>;
export type WsMatchCreated = z.infer<typeof wsMatchCreatedSchema>;
export type WsMatchDeleted = z.infer<typeof wsMatchDeletedSchema>;
export type WsError = z.infer<typeof wsErrorSchema>;
