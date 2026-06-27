import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMyBets } from './betsApi';

export type MyBetsFilter = 'open' | 'lost' | 'won';

const MY_BETS_KEY = 'my-bets';

export function myBetsQueryKey(scope: string, filter: MyBetsFilter) {
  return [MY_BETS_KEY, scope, filter] as const;
}

export function invalidateMyBetsQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: [MY_BETS_KEY] });
}

type Options = {
  scope: 'page' | 'betslip';
  filter: MyBetsFilter;
  authHeaders: Record<string, string>;
  enabled?: boolean;
  limit?: number;
};

export function useMyBetsQuery({
  scope,
  filter,
  authHeaders,
  enabled = true,
  limit = scope === 'page' ? 50 : 30,
}: Options) {
  const queryClient = useQueryClient();

  const q = useQuery({
    queryKey: myBetsQueryKey(scope, filter),
    queryFn: () => fetchMyBets(authHeaders, { limit, settlementStatus: filter }),
    enabled,
    staleTime: filter === 'open' ? 5_000 : 20_000,
    refetchInterval: filter === 'open' ? 15_000 : false,
    refetchOnMount: 'always',
    select: (data) => ({
      ...data,
      items: data.items.filter((bet) => bet.settlementStatus === filter),
    }),
  });

  const setFilterAndRefresh = (next: MyBetsFilter, setFilter: (f: MyBetsFilter) => void) => {
    setFilter(next);
    invalidateMyBetsQueries(queryClient);
  };

  return { ...q, setFilterAndRefresh, queryClient };
}

export type MyBetsQueryResult = ReturnType<typeof useMyBetsQuery>;
