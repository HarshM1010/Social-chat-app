import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const httpLink = new HttpLink({
  uri: `${BACKEND_URL}/graphql`,
  credentials: 'include',
});

const wsUrl = BACKEND_URL.replace(/^http/, 'ws') + '/graphql';

const wsLink = typeof window !== 'undefined'
  ? new GraphQLWsLink(
      createClient({
        url: wsUrl,
      })
    )
  : null;

// Split based on operation type
const splitLink = typeof window !== 'undefined' && wsLink
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        );
      },
      wsLink,
      httpLink
    )
  : httpLink;

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});