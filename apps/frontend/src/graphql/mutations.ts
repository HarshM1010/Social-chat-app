import { gql } from '@apollo/client';

export const SUBMIT_ANSWER = gql`
    mutation SubmitAnswer($optionId: String!) {
        submitAnswer(optionId: $optionId) {
            userId,
            preference
        }
    }
`;

export const SEND_FRIEND_REQUEST = gql`
    mutation SendFriendRequest($to: String!) {
        sendFriendRequest(to: $to)
    }
`;

export const CANCEL_FRIEND_REQUEST = gql`
    mutation CancelFriendRequest($to: String!) {
        cancelFriendRequest(to: $to)
    }
`;

export const ACCEPT_FRIEND_REQUEST = gql`
    mutation AcceptFriendRequest($senderId: String!) {
        acceptFriendRequest(senderId: $senderId)
    }
`;

export const REJECT_FRIEND_REQUEST = gql`
    mutation RejectFriendRequest($from: String!) {
        rejectFriendRequest(from: $from)
    }
`;

export const FORGET_FRIEND = gql`
    mutation ForgetFriend($friendId: String!,$roomId: String) {
        forgetFriend(friendId: $friendId,roomId: $roomId)
    }
`;

export const CREATE_PRIVATE_CHAT = gql`
    mutation CreatePrivateChat($partnerId: ID!) {
        createPrivateChat(partnerId: $partnerId) {
            id     
        }
    }
`;

export const DELETE_PRIVATE_CHAT = gql`
    mutation DeletePrivateChat($partnerId: ID!) {
        deletePrivateChat(partnerId: $partnerId)
    }   
`;

export const CREATE_GROUP_CHAT = gql`
    mutation CreateGroupChat($name: String!, $friendIds: [ID!]!) {
        createGroupChat(name: $name, friendIds: $friendIds) {
            id
            name
            admins {
                userId
                username
            }
            members {
                userId
                username
            }
        }
    }
`;

export const ADD_MEMBER_TO_GROUP = gql`
    mutation AddMemberToGroup($groupId: String!, $newMemberId: String!) {
        addMemberToGroup(groupId: $groupId, newMemberId: $newMemberId)
    }
`;

export const LEAVE_GROUP = gql`
    mutation LeaveGroup($groupId: ID!) {
        leaveGroup(groupId: $groupId)
    }
`;

export const MAKE_GROUP_ADMIN = gql`
    mutation MakeGroupAdmin($groupId: String!, $targetUserId: String!) {
        makeGroupAdmin(groupId: $groupId, targetUserId: $targetUserId)
    }
`;

export const REMOVE_GROUP_ADMIN = gql`
    mutation RemoveGroupAdmin($groupId: String!, $targetUserId: String!) {
        removeGroupAdmin(groupId: $groupId, targetUserId: $targetUserId) 
    }
`;

export const DELETE_GROUP = gql`
    mutation DeleteGroup($groupId: ID!) {
        deleteGroup(groupId: $groupId)
    }
`;

export const SEND_MESSAGE = gql`
    mutation SendMessage($input: CreateMessageInput!) {
        sendMessage(input: $input) {
            _id
            roomId
            senderId
            content
            createdAt
            status
            readBy {
                userId
                readAt
            }
        }
    }
`;

export const DELETE_MESSAGE = gql`
    mutation DeleteMessage($messageId: ID!) {
        deleteMessage(id: $messageId) {
            _id
            roomId
        }
    }
`;

export const REMOVE_GROUP_MEMBER = gql`
    mutation RemoveGroupMember($groupId: String!, $targetUserId: String!) {
        removeGroupMember(groupId: $groupId, targetUserId: $targetUserId)
    }
`;