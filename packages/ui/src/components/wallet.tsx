'use client'
import { useState, type ReactElement } from "react";
import Image from "next/image";
import type { Transfer, TransferStake, Stake, TransactionResult } from "@repo/commune-ts/types";
import Link from "next/link";
import type { InjectedAccountWithMeta } from "../types";
import { CopyButton } from "./copy-button.tsx";
import { WalletButton } from "./wallet-button";
import { SelectWalletModal } from "./select-wallet-modal";
import { Loading } from "./loading";
import { formatToken, copyToClipboard } from "../../../subspace/utils";
import { cn } from "..";

interface TWallet {
  handleWalletModal: (state?: boolean) => void
  openWalletModal: boolean
  stakeOut: {
    total: bigint;
    perAddr: Map<string, bigint>;
    perNet: Map<number, bigint>;
    perAddrPerNet: Map<number, Map<string, bigint>>;
  } | undefined
  balance: string
  handleConnect: () => void;
  isInitialized: boolean;
  selectedAccount: InjectedAccountWithMeta | null
  wallets: InjectedAccountWithMeta[];
  handleWalletSelections: (arg: InjectedAccountWithMeta) => void;

  transfer: (args: Transfer) => void;
  transferStake: (args: TransferStake) => void;

  addStake: (args: Stake) => void;
  removeStake: (args: Stake) => void;
}

type MenuType =
  | "send"
  | "receive"
  | "stake"
  | "unstake"
  | "transfer"
  | null;

export function Wallet(props: TWallet): ReactElement {
  const {
    selectedAccount,
    handleConnect,
    isInitialized,
    openWalletModal,
    handleWalletModal,
    stakeOut,
    balance,
    handleWalletSelections,
    wallets,
    addStake,
    removeStake,
    transfer,
    transferStake
  } = props;

  const [openSelectWalletModal, setOpenSelectWalletModal] = useState(false)

  const [activeMenu, setActiveMenu] = useState<MenuType>(null);
  const [validator, setValidator] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [netUid, setNetUid] = useState<number>(0);

  const [transactionStatus, setTransactionStatus] = useState<TransactionResult>(
    {
      status: null,
      message: null,
      finalized: false,
    },
  );

  const [inputError, setInputError] = useState<{
    validator: string | null;
    value: string | null;
  }>({ validator: null, value: null });

  const handleCallback = (callbackReturn: TransactionResult) => {
    setTransactionStatus(callbackReturn);
  };

  const handleMenuClick = (type: MenuType) => {
    setValidator("");
    setAmount("");
    setActiveMenu(type);
  };

  const handleCheckInput = () => {
    setInputError({ validator: null, value: null });
    if (!validator)
      setInputError((prev) => ({
        ...prev,
        validator: "Validator Address cannot be empty",
      }));
    if (!amount)
      setInputError((prev) => ({ ...prev, value: "Value cannot be empty" }));
    return Boolean(amount && validator);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedAccount) {
      setTransactionStatus({
        status: "ERROR",
        finalized: true,
        message: "Select your wallet",
      });
      return
    }

    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting transaction...",
    });

    const isValidInput = handleCheckInput();

    if (!isValidInput) {
      setTransactionStatus({
        status: "ERROR",
        finalized: true,
        message: "Input error...",
      });
      return
    };

    if (activeMenu === "stake") {
      addStake({
        validator,
        amount,
        netUid,
        callback: handleCallback,
      });
    }
    if (activeMenu === "unstake") {
      removeStake({
        validator,
        amount,
        netUid,
        callback: handleCallback,
      });
    }
    if (activeMenu === "transfer") {
      transferStake({
        fromValidator: selectedAccount.address,
        toValidator: validator,
        amount,
        netUid,
        callback: handleCallback,
      });
    }
    if (activeMenu === "send") {
      transfer({
        to: validator,
        amount,
        callback: handleCallback,
      });
    }
    if (activeMenu === "receive") {
      void copyToClipboard(selectedAccount.address);
    }
  };

  const walletActions = [
    {
      icon: 'send-icon.svg',
      name: 'Send',
      handleMenuClick: (menuType: MenuType) => { handleMenuClick(menuType); },
      textColor: 'text-red-500',
      bgColor: 'bg-red-500/15'
    },
    {
      icon: 'receive-icon.svg',
      name: 'Receive',
      handleMenuClick: (menuType: MenuType) => { handleMenuClick(menuType); },
      textColor: 'ui-text-blue-500',
      bgColor: 'bg-blue-500/15'

    },
    {
      icon: 'stake-icon.svg',
      name: 'Stake',
      handleMenuClick: (menuType: MenuType) => { handleMenuClick(menuType); },
      textColor: 'text-yellow-500',
      bgColor: 'bg-yellow-500/15'

    },
    {
      icon: 'unstake-icon.svg',
      name: 'Unstake',
      handleMenuClick: (menuType: MenuType) => { handleMenuClick(menuType); },
      textColor: 'text-purple-500',
      bgColor: 'bg-purple-500/15'
    },
    {
      icon: 'transfer-icon.svg',
      name: 'Transfer',
      handleMenuClick: (menuType: MenuType) => { handleMenuClick(menuType); },
      textColor: 'text-green-500',
      bgColor: 'bg-green-500/15'
    },
  ]


  let userStakeWeight: bigint | null = null;
  if (stakeOut != null && selectedAccount != null) {
    const userStakeEntry = stakeOut.perAddr.get(
      selectedAccount.address,
    );
    userStakeWeight = userStakeEntry ?? 0n;
  }

  const freeBalancePercentage = 100 - (Number(userStakeWeight) / Number(balance) * 100)

  const handleSelectWallet = () => {
    setOpenSelectWalletModal(true)
    handleConnect()
  }

  const handleWalletSelectionModal = (args: InjectedAccountWithMeta) => {
    handleWalletSelections(args)
    setOpenSelectWalletModal(false)
    handleWalletModal(true)
  }

  return (
    <div className={cn(openWalletModal ? "block" : "hidden")}>
      <div
        className={cn("fixed left-0 h-[100vh] w-full z-[100] backdrop-blur-sm")}
        onClick={() => {
          handleWalletModal(false);
          setOpenSelectWalletModal(false);
        }}
      />
      {!openSelectWalletModal && (
        <div className={cn("border-gray-500 bg-black/70 border fixed z-[100] right-0 top-0 m-4")}>
          <div className={cn("border-b border-gray-500 p-4 flex justify-between gap-2")}>
            <WalletButton
              className={cn("w-full")}
              hook={{ handleConnect: handleSelectWallet, selectedAccount, isInitialized }}
            />
            <CopyButton code={selectedAccount?.address || ""} />
            {/* <button className={cn("text-gray-400 border-gray-500 border px-4 py-2")} onClick={() => { setOpen(false) }} type="button">X</button> */}
          </div>
          <div className={cn("border-b border-gray-500 p-4 gap-4 text-white flex flex-col")}>
            <div className={cn("border-gray-500 border p-4")}>
              <div className={cn("w-full flex justify-between")}>
                <div>
                  <p className={cn("text-green-500 text-xl")}>
                    {balance}
                    <span className={cn("text-sm text-gray-400 font-light ml-1")}>COMAI</span>
                  </p>
                  <p className={cn("text-xs text-gray-500")}>Free Balance</p>
                </div>
                <div className={cn("text-right")}>
                  <p className={cn("text-red-500 text-xl")}>
                    {formatToken(userStakeWeight || 0)}
                    <span className={cn("text-sm text-gray-400 font-light ml-1")}>COMAI</span>
                  </p>
                  <p className={cn("text-xs text-gray-500")}>Staked Balance</p>
                </div>
              </div>
              <div className={cn("w-full relative h-2 flex pt-1")}>
                <span className={cn("absolute bg-green-500 h-2")} style={{ width: `${freeBalancePercentage.toFixed(2)}%` }} />
                <span className={cn("w-full bg-red-500 h-2")} />
              </div>
            </div>
          </div>
          <div className={cn("p-4 flex")}>
            <div className={cn("flex border border-gray-500")}>
              {walletActions.map((action) => {
                return (
                  <button
                    className={cn(`text-gray-400 border-gray-500 px-4 py-3 flex flex-col items-center w-1/5 ${activeMenu == action.name.toLocaleLowerCase() ? action.bgColor : ""}`)}
                    key={action.name}
                    onClick={() => {
                      action.handleMenuClick(action.name.toLowerCase() as MenuType);
                    }}
                    type="button"
                  >
                    <Image alt={`${action.name} Icon`} height={20} src={action.icon} width={20} />
                    <span className={cn(`${action.textColor} text-sm`)}>{action.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className={cn(`border-t border-gray-500 p-4 gap-4 text-white flex flex-col ${activeMenu ? "flex" : "hidden"}`)}>
            <form className={cn("flex w-full flex-col gap-4")} onSubmit={handleSubmit}>
              <div className={cn("w-full")}>
                <span className={cn("text-base")}>
                  {activeMenu === "stake" || activeMenu === "transfer" || activeMenu === "unstake" ? (
                    <div className={cn("flex flex-col items-end gap-3 md:flex-row")}>
                      <p>Validator Address</p>
                      <Link className={cn("text-sm text-blue-500 hover:underline")} href="https://www.comstats.org/" target="_blank">
                        View a list of validators here
                      </Link>
                    </div>
                  ) : (
                    "To Address"
                  )}
                </span>
                <input
                  className={cn("w-full border border-gray-500 bg-black p-2 text-gray-400")}
                  disabled={transactionStatus.status === "PENDING"}
                  onChange={(e) => {
                    setValidator(e.target.value);
                  }}
                  placeholder={
                    activeMenu === "stake" || activeMenu === "transfer" || activeMenu === "unstake"
                      ? "The full address of the validator"
                      : "The full address of the recipient"
                  }
                  type="text"
                  value={validator}
                />
              </div>
              {inputError.validator ? (
                <p className={cn("--mt-2 mb-1 flex text-left text-base text-red-400")}>{inputError.validator}</p>
              ) : null}
              <div className={cn("w-full")}>
                <p className={cn("text-base")}>Value</p>
                <input
                  className={cn("w-full border border-gray-500 bg-black p-2 text-gray-400")}
                  disabled={transactionStatus.status === "PENDING"}
                  onChange={(e) => {
                    setAmount(e.target.value);
                  }}
                  placeholder="The amount of COMAI to use in the transaction"
                  type="text"
                  value={amount}
                />
              </div>
              {inputError.value ? (
                <p className={cn("--mt-2 mb-1 flex text-left text-base text-red-400")}>{inputError.value}</p>
              ) : null}
              {(activeMenu === "stake" || activeMenu === "unstake" || activeMenu === "transfer") && (
                <div className={cn("w-full")}>
                  <p className={cn("text-base")}>Net UID</p>
                  <input
                    className={cn("w-full border border-gray-500 bg-black p-2 text-gray-400")}
                    disabled={transactionStatus.status === "PENDING"}
                    onChange={(e) => {
                      setNetUid(parseInt(e.target.value));
                    }}
                    placeholder="The net UID to use in the transaction"
                    type="number"
                    value={netUid}
                  />
                </div>
              )}
              <button
                className={cn("border-green-500 w-full border py-2 text-green-500")}
                disabled={transactionStatus.status === "PENDING"}
                type="submit"
              >
                Submit
              </button>
            </form>
            {transactionStatus.status ? (
              <p
                className={cn(`items-center gap-3 pt-6 ${transactionStatus.status === "PENDING" && "text-yellow-400"} ${transactionStatus.status === "ERROR" && "text-red-400"} ${transactionStatus.status === "SUCCESS" && "text-green-400"} flex text-left text-base`)}
              >
                {transactionStatus.status === "PENDING" && <Loading />}
                {transactionStatus.message}
              </p>
            ) : null}
          </div>
        </div>
      )}
      <SelectWalletModal
        handleWalletSelections={handleWalletSelectionModal}
        open={openSelectWalletModal}
        setOpen={setOpenSelectWalletModal}
        wallets={wallets}
      />
    </div>

  )
}