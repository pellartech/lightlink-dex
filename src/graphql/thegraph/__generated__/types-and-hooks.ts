import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T;
export type InputMaybe<T> = T;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  BigDecimal: any;
  BigInt: any;
  Bytes: any;
  Int8: any;
};

export type Block = {
  __typename?: 'Block';
  id: Scalars['ID'];
  number: Scalars['BigInt'];
  timestamp: Scalars['BigInt'];
};

export type Block_Filter = {
  timestamp_gt?: InputMaybe<Scalars['BigInt']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']>;
};

export type Block_Height = {
  hash?: InputMaybe<Scalars['Bytes']>;
  number?: InputMaybe<Scalars['Int']>;
  number_gte?: InputMaybe<Scalars['Int']>;
};

export enum Block_OrderBy {
  Number = 'number',
  Timestamp = 'timestamp'
}

export type Bundle = {
  __typename?: 'Bundle';
  ethPriceUSD: Scalars['BigDecimal'];
  id: Scalars['ID'];
};

export type Bundle_Filter = {
  id?: InputMaybe<Scalars['ID']>;
};

export enum OrderDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export type Pool = {
  __typename?: 'Pool';
  createdAtBlockNumber: Scalars['BigInt'];
  createdAtTimestamp: Scalars['BigInt'];
  feeTier: Scalars['BigInt'];
  id: Scalars['ID'];
  liquidity: Scalars['BigInt'];
  sqrtPrice: Scalars['BigInt'];
  tick?: Maybe<Scalars['BigInt']>;
  token0: Token;
  token0Price: Scalars['BigDecimal'];
  token1: Token;
  token1Price: Scalars['BigDecimal'];
  totalValueLockedETH: Scalars['BigDecimal'];
  totalValueLockedToken0: Scalars['BigDecimal'];
  totalValueLockedToken1: Scalars['BigDecimal'];
  totalValueLockedUSD: Scalars['BigDecimal'];
  txCount: Scalars['BigInt'];
  volumeToken0: Scalars['BigDecimal'];
  volumeToken1: Scalars['BigDecimal'];
  volumeUSD: Scalars['BigDecimal'];
};

export type Pool_Filter = {
  id?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  token0?: InputMaybe<Scalars['String']>;
  token0_in?: InputMaybe<Array<Scalars['String']>>;
  token1?: InputMaybe<Scalars['String']>;
  token1_in?: InputMaybe<Array<Scalars['String']>>;
};

export enum Pool_OrderBy {
  TotalValueLockedToken0 = 'totalValueLockedToken0',
  TotalValueLockedUsd = 'totalValueLockedUSD',
  TxCount = 'txCount',
  VolumeUsd = 'volumeUSD'
}

export type Query = {
  __typename?: 'Query';
  _meta?: Maybe<_Meta_>;
  blocks: Array<Block>;
  bundles: Array<Bundle>;
  pool?: Maybe<Pool>;
  pools: Array<Pool>;
  ticks: Array<Tick>;
  token?: Maybe<Token>;
  tokens: Array<Token>;
};


export type Query_MetaArgs = {
  block?: InputMaybe<Block_Height>;
};


export type QueryBlocksArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Block_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<Block_Filter>;
};


export type QueryBundlesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Bundle_Filter>;
};


export type QueryPoolArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryPoolsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Pool_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Pool_Filter>;
};


export type QueryTicksArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Tick_OrderBy>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Tick_Filter>;
};


export type QueryTokenArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTokensArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<Token_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Token_Filter>;
};

export type Tick = {
  __typename?: 'Tick';
  id: Scalars['ID'];
  liquidityGross: Scalars['BigInt'];
  liquidityNet: Scalars['BigInt'];
  pool: Pool;
  poolAddress?: Maybe<Scalars['String']>;
  price0: Scalars['BigDecimal'];
  price1: Scalars['BigDecimal'];
  tickIdx: Scalars['BigInt'];
};

export type Tick_Filter = {
  poolAddress?: InputMaybe<Scalars['String']>;
  tickIdx_gte?: InputMaybe<Scalars['BigInt']>;
  tickIdx_lte?: InputMaybe<Scalars['BigInt']>;
};

export enum Tick_OrderBy {
  TickIdx = 'tickIdx'
}

export type Token = {
  __typename?: 'Token';
  decimals: Scalars['BigInt'];
  derivedETH: Scalars['BigDecimal'];
  id: Scalars['ID'];
  name: Scalars['String'];
  symbol: Scalars['String'];
  totalSupply: Scalars['BigInt'];
  totalValueLocked: Scalars['BigDecimal'];
  totalValueLockedUSD: Scalars['BigDecimal'];
  volume: Scalars['BigDecimal'];
  volumeUSD: Scalars['BigDecimal'];
};

export type Token_Filter = {
  id?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  name_contains?: InputMaybe<Scalars['String']>;
  symbol_contains?: InputMaybe<Scalars['String']>;
};

export enum Token_OrderBy {
  TotalValueLockedUsd = 'totalValueLockedUSD',
  VolumeUsd = 'volumeUSD'
}

export type _Block_ = {
  __typename?: '_Block_';
  hash?: Maybe<Scalars['Bytes']>;
  number: Scalars['Int'];
  timestamp?: Maybe<Scalars['Int']>;
};

export type _Meta_ = {
  __typename?: '_Meta_';
  block: _Block_;
  deployment: Scalars['String'];
  hasIndexingErrors: Scalars['Boolean'];
};

export enum _SubgraphErrorPolicy_ {
  Allow = 'allow',
  Deny = 'deny'
}

export type AllV3TicksQueryVariables = Exact<{
  poolAddress?: InputMaybe<Scalars['String']>;
  skip: Scalars['Int'];
}>;


export type AllV3TicksQuery = { __typename?: 'Query', ticks: Array<{ __typename?: 'Tick', liquidityNet: any, price0: any, price1: any, tick: any }> };

export type FeeTierDistributionQueryVariables = Exact<{
  token0: Scalars['String'];
  token1: Scalars['String'];
}>;


export type FeeTierDistributionQuery = { __typename?: 'Query', _meta?: { __typename?: '_Meta_', block: { __typename?: '_Block_', number: number } }, asToken0: Array<{ __typename?: 'Pool', feeTier: any, totalValueLockedToken0: any, totalValueLockedToken1: any }>, asToken1: Array<{ __typename?: 'Pool', feeTier: any, totalValueLockedToken0: any, totalValueLockedToken1: any }> };

export type PoolDataQueryVariables = Exact<{
  poolId?: InputMaybe<Array<Scalars['ID']> | Scalars['ID']>;
  block?: InputMaybe<Block_Height>;
}>;


export type PoolDataQuery = { __typename?: 'Query', pools: Array<{ __typename?: 'Pool', id: string, feeTier: any, liquidity: any, sqrtPrice: any, tick?: any, token0Price: any, token1Price: any, volumeUSD: any, volumeToken0: any, volumeToken1: any, txCount: any, totalValueLockedToken0: any, totalValueLockedToken1: any, totalValueLockedUSD: any, token0: { __typename?: 'Token', id: string, symbol: string, name: string, decimals: any, derivedETH: any }, token1: { __typename?: 'Token', id: string, symbol: string, name: string, decimals: any, derivedETH: any } }>, bundles: Array<{ __typename?: 'Bundle', ethPriceUSD: any }> };


export const AllV3TicksDocument = gql`
    query AllV3Ticks($poolAddress: String, $skip: Int!) {
  ticks(
    first: 1000
    skip: $skip
    where: {poolAddress: $poolAddress}
    orderBy: tickIdx
  ) {
    tick: tickIdx
    liquidityNet
    price0
    price1
  }
}
    `;

/**
 * __useAllV3TicksQuery__
 *
 * To run a query within a React component, call `useAllV3TicksQuery` and pass it any options that fit your needs.
 * When your component renders, `useAllV3TicksQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAllV3TicksQuery({
 *   variables: {
 *      poolAddress: // value for 'poolAddress'
 *      skip: // value for 'skip'
 *   },
 * });
 */
export function useAllV3TicksQuery(baseOptions: Apollo.QueryHookOptions<AllV3TicksQuery, AllV3TicksQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<AllV3TicksQuery, AllV3TicksQueryVariables>(AllV3TicksDocument, options);
      }
export function useAllV3TicksLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<AllV3TicksQuery, AllV3TicksQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<AllV3TicksQuery, AllV3TicksQueryVariables>(AllV3TicksDocument, options);
        }
export type AllV3TicksQueryHookResult = ReturnType<typeof useAllV3TicksQuery>;
export type AllV3TicksLazyQueryHookResult = ReturnType<typeof useAllV3TicksLazyQuery>;
export type AllV3TicksQueryResult = Apollo.QueryResult<AllV3TicksQuery, AllV3TicksQueryVariables>;
export const FeeTierDistributionDocument = gql`
    query FeeTierDistribution($token0: String!, $token1: String!) {
  _meta {
    block {
      number
    }
  }
  asToken0: pools(
    orderBy: totalValueLockedToken0
    orderDirection: desc
    where: {token0: $token0, token1: $token1}
  ) {
    feeTier
    totalValueLockedToken0
    totalValueLockedToken1
  }
  asToken1: pools(
    orderBy: totalValueLockedToken0
    orderDirection: desc
    where: {token0: $token1, token1: $token0}
  ) {
    feeTier
    totalValueLockedToken0
    totalValueLockedToken1
  }
}
    `;

/**
 * __useFeeTierDistributionQuery__
 *
 * To run a query within a React component, call `useFeeTierDistributionQuery` and pass it any options that fit your needs.
 * When your component renders, `useFeeTierDistributionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFeeTierDistributionQuery({
 *   variables: {
 *      token0: // value for 'token0'
 *      token1: // value for 'token1'
 *   },
 * });
 */
export function useFeeTierDistributionQuery(baseOptions: Apollo.QueryHookOptions<FeeTierDistributionQuery, FeeTierDistributionQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<FeeTierDistributionQuery, FeeTierDistributionQueryVariables>(FeeTierDistributionDocument, options);
      }
export function useFeeTierDistributionLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<FeeTierDistributionQuery, FeeTierDistributionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<FeeTierDistributionQuery, FeeTierDistributionQueryVariables>(FeeTierDistributionDocument, options);
        }
export type FeeTierDistributionQueryHookResult = ReturnType<typeof useFeeTierDistributionQuery>;
export type FeeTierDistributionLazyQueryHookResult = ReturnType<typeof useFeeTierDistributionLazyQuery>;
export type FeeTierDistributionQueryResult = Apollo.QueryResult<FeeTierDistributionQuery, FeeTierDistributionQueryVariables>;
export const PoolDataDocument = gql`
    query PoolData($poolId: [ID!], $block: Block_height = null) {
  pools(
    where: {id_in: $poolId}
    block: $block
    orderBy: totalValueLockedUSD
    orderDirection: desc
    subgraphError: allow
  ) {
    id
    feeTier
    liquidity
    sqrtPrice
    tick
    token0 {
      id
      symbol
      name
      decimals
      derivedETH
    }
    token1 {
      id
      symbol
      name
      decimals
      derivedETH
    }
    token0Price
    token1Price
    volumeUSD
    volumeToken0
    volumeToken1
    txCount
    totalValueLockedToken0
    totalValueLockedToken1
    totalValueLockedUSD
  }
  bundles(where: {id: "1"}) {
    ethPriceUSD
  }
}
    `;

/**
 * __usePoolDataQuery__
 *
 * To run a query within a React component, call `usePoolDataQuery` and pass it any options that fit your needs.
 * When your component renders, `usePoolDataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePoolDataQuery({
 *   variables: {
 *      poolId: // value for 'poolId'
 *      block: // value for 'block'
 *   },
 * });
 */
export function usePoolDataQuery(baseOptions?: Apollo.QueryHookOptions<PoolDataQuery, PoolDataQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PoolDataQuery, PoolDataQueryVariables>(PoolDataDocument, options);
      }
export function usePoolDataLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PoolDataQuery, PoolDataQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PoolDataQuery, PoolDataQueryVariables>(PoolDataDocument, options);
        }
export type PoolDataQueryHookResult = ReturnType<typeof usePoolDataQuery>;
export type PoolDataLazyQueryHookResult = ReturnType<typeof usePoolDataLazyQuery>;
export type PoolDataQueryResult = Apollo.QueryResult<PoolDataQuery, PoolDataQueryVariables>;