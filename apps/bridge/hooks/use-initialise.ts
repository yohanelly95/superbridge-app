import { useRouter } from "next/router";
import { useEffect } from "react";
import { useAccountEffect } from "wagmi";

import { useConfigState } from "@/state/config";
import { usePendingTransactions } from "@/state/pending-txs";
import { isMainnet, isOptimism } from "@/utils/is-mainnet";

import { useDeployments } from "./use-deployments";
import { useInitialiseToken } from "./use-initialise-token";
import { useIsContractAccount } from "./use-is-contract-account";
import { useInitialiseRecipient } from "./use-recipient";
import { useTokenLists } from "./use-token-lists";
import { useInitialiseArbitrumNativeTokens } from "./arbitrum/use-initialise-arbitrum-native-tokens";

export const useInitialise = () => {
  const router = useRouter();

  const { deployments, isLoading: deploymentsLoading } = useDeployments();
  const isContractAccount = useIsContractAccount();

  const deployment = useConfigState.useDeployment();
  const setDeployment = useConfigState.useSetDeployment();
  const setEasyMode = useConfigState.useSetEasyMode();
  const setForceViaL1 = useConfigState.useSetForceViaL1();
  const setWithdrawing = useConfigState.useSetWithdrawing();
  const initialised = useConfigState.useInitialised();
  const setInitialised = useConfigState.useSetInitialised();
  const clearPendingTransactionsStorage = usePendingTransactions.useLogout();

  useInitialiseRecipient();
  useTokenLists();
  useInitialiseToken();
  useInitialiseArbitrumNativeTokens();

  useAccountEffect({
    onDisconnect: () => {
      clearPendingTransactionsStorage();
    },
  });

  useEffect(() => {
    const direction = router.query.direction as string | undefined;
    if (direction === "withdraw") {
      setWithdrawing(true);
    }
  }, []);

  useEffect(() => {
    if (deploymentsLoading || initialised) {
      return;
    }

    const id = router.query.id as string | undefined;

    if (deployments.length === 1) {
      setDeployment(deployments[0]);
      setInitialised();
      return;
    }

    const d = deployments.find((x) => x.name === id);
    if (d) {
      setDeployment(d);
      setTimeout(() => {
        setInitialised();
      }, 500);
      return;
    }

    setDeployment(null);
    setInitialised();
  }, [deployments, deploymentsLoading, router.query, initialised]);

  useEffect(() => {
    if (isContractAccount.data === true) {
      setForceViaL1(false);
    }
  }, [isContractAccount.data]);

  // reset settings when changing deployment
  useEffect(() => {
    if (!deployment) {
      setEasyMode(false);
      setForceViaL1(false);
      return;
    }

    if (!isMainnet(deployment)) {
      setEasyMode(false);
      return;
    }

    if (!isOptimism(deployment)) {
      setForceViaL1(false);
      return;
    }
  }, [deployment]);
};
