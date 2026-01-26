import { gql } from '@apollo/client';

export const LISTEN_FOR_MESSAGES = gql`
    subscription ListenForMessages($roomId: String!) {
        messageAdded(roomId: $roomId) {
            _id
            content
            senderId
            status
            sender {
                username
            }
        }
    }
`;

export const LISTEN_FOR_DELETED_MESSAGE = gql`
    subscription ListenForDeletion($roomId: String!) {
        messageDeleted(roomId: $roomId) {
            _id
            roomId
        }
    }
`;

export const LISTEN_FOR_FRIEND_REMOVED = gql`
    subscription OnFriendRemoved($userId: String!) {
        friendRemoved(userId: $userId) {
            targetUserId
            removedUserId
        }
    }
`;

export const LISTEN_FOR_SENT_REQUEST = gql`
    subscription ListenForSentRequest($userId: String!) {
        friendRequestReceived(userId: $userId) {
            username
    		name
    		userId
        }
    }
`;

export const LISTEN_FOR_CANCELLED_REQUEST = gql`
    subscription ListenForCancelledRequest($userId: String!) {
        cancelRequestReceived(userId: $userId)
    }
`;

export const LISTEN_FOR_ACCEPTED_REQUEST = gql`
    subscription ListenForAcceptedRequest($userId: String!) {
        acceptRequestReceived(userId: $userId)
    }
`;

export const LISTEN_FOR_REJECTED_REQUEST = gql`
    subscription ListenForRejectedRequest($userId: String!) {
        rejectRequestReceived(userId: $userId)
    }
`;

export const LISTEN_FOR_ADDED_MEMBER = gql`
    subscription ListenForAddedMember($userId: String!) {
        addedMemberReceived(userId: $userId)
    }
`;

export const LISTEN_FOR_ADDED_MEM_ROSTER_UPDATED = gql`
    subscription ListenForAddedMemRosterUpdated($groupId: String!) {
        addedMemRosterUpdated(groupId: $groupId)
    }
`;

export const LISTEN_FOR_REMOVED_MEMBER = gql`
    subscription ListenForRemovedMember($userId: String!) {
        removedMemberReceived(userId: $userId) {
            groupId
        }
    }
`;

export const LISTEN_FOR_REMOVED_MEM_ROSTER_UPDATED = gql`
    subscription ListenForRemovedMemRosterUpdated($groupId: String!) {
        removedMemRosterUpdated(groupId: $groupId)
    }
`;

export const LISTEN_FOR_ADMIN_STATUS_CHANGED = gql`
    subscription ListenForAdminStatusChanged($groupId: String!) {
        adminStatusChanged(groupId: $groupId)
    }
`;