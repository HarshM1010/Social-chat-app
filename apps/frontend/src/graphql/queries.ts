import { gql } from '@apollo/client';

export const GET_ALL_REQUESTS = gql`
  query GetAllRequests {
    getAllRequests{
      userId
      name
      username
    }
  }
`;

export const GET_ALL_FRIENDS = gql`
  query GetAllFriends {
      getAllFriends {
          userId
          roomId
          name
          username 
          lastMessage
      }
  }
`;

export const GET_ROOM_ID = gql`
  query GetRoomId($friendId: String!) {
    getRoomId(friendId:$friendId)
  }
`

export const GET_ALL_REQUESTED = gql`
  query GetAllRequested {
      getAllRequested {
          userId
          name
          username
      }
  }
`;

export const GET_ALL_GROUPS = gql`
  query GetAllGroups {
    getAllGroups {
        name
        id
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

export const GET_GROUP_MEMBERS = gql`
  query GetGroupMembers($groupId: String!) {
    getGroupMembers(groupId: $groupId) {
      userId
      username
      name
    }
  }
`;

export const SEARCH_USERS = gql`
  query SearchUsers($username: String!) {
    searchUsers(username: $username) {
      userId
      username
      name
      requestStatus
    }
  }
`;

export const GET_MESSAGES = gql`
  query GetMessages($roomId: String,$friendId: String, $limit: Int = 20, $skip: Int = 0) {
    getMessages(roomId: $roomId,friendId: $friendId, limit: $limit, skip: $skip) {
      roomId
      messages {
        _id
        senderId
        sender {
          username
        }
        content  
        status
        createdAt
        readBy {
          userId
          readAt
        }
      }
    }
  }
`;

export const GET_ALL_NON_ADMINS = gql`
  query GetAllNonAdmins($groupId: String!) {
    getAllNonAdmins(groupId: $groupId) {
      userId
      username
      name
    }
  }
`;

export const GET_ALL_ADMINS = gql`
  query GetAllAdmins($groupId: String!) {
    getAllAdmins(groupId: $groupId) {
      userId
      username
      name
    } 
  }
`;

export const GET_USER_STATS = gql`
  query GetUserStats {
    getUserStats {
      friendsCount
      groupsCount
      preference
    }
  }
`;

export const IS_FRIEND = gql`
  query IsFriend($targetUserId: ID!) {
    isFriend(targetUserId: $targetUserId)
  }
`;

export const GET_ADMINS_TO_REMOVE = gql`
  query GetAdminsToRemove($groupId: ID!) {
    getAdminsToRemove(groupId: $groupId) {
      userId
      username
      name   
    }
  }
`;

export const GET_SUGGESTIONS = gql`
  query GetSuggestions {
    getSuggestions {
      username
      userId
      name
    }
  }
`;