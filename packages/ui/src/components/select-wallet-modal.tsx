"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { XMarkIcon } from "@heroicons/react/16/solid";

import type { InjectedAccountWithMeta } from "../types";
import { cn } from "..";
import { smallAddress } from "../../../subspace/utils";

export function SelectWalletModal({
  open,
  wallets,
  setOpen,
  handleWalletSelections,
}: {
  open: boolean;
  setOpen: (args: boolean) => void;
  wallets: InjectedAccountWithMeta[];
  handleWalletSelections: (arg: InjectedAccountWithMeta) => void;
}): JSX.Element {
  const [selectedAccount, setSelectedAccount] =
    useState<InjectedAccountWithMeta>();
  return (
    <div
      className={cn(`fixed z-[150] w-fit ${open ? "block" : "hidden"}`)}
      role="dialog"
    >
      {/* Modal */}
      <div className={cn("fixed right-0 z-10 overflow-y-auto w-full")}>
        <div
          className={cn(
            "flex min-h-full items-center justify-end p-4 text-center",
          )}
        >
          <div
            className={cn(
              "relative w-full max-w-fit transform overflow-hidden border border-gray-500 bg-black/70 text-left text-white backdrop-blur-sm",
            )}
          >
            {/* Modal Header */}
            <div
              className={cn(
                "flex flex-row items-center justify-between gap-3 border-b border-gray-500 p-4",
              )}
            >
              <div className={cn("flex flex-col items-center md:flex-row")}>
                <Image
                  alt="Module Logo"
                  height={32}
                  src="/logo.svg"
                  width={32}
                />
                <h3 className={cn("pl-2 text-xl font-light leading-6")}>
                  Select Wallet
                </h3>
              </div>
              <button
                className={cn(
                  "border border-gray-500 p-2 transition duration-200",
                )}
                onClick={() => {
                  setOpen(false);
                }}
                type="button"
              >
                <XMarkIcon className={cn("h-5 w-5")} />
              </button>
            </div>

            {/* Modal Body */}
            <div className={cn("flex flex-col gap-y-4 overflow-y-auto p-4")}>
              {wallets.map((item) => (
                <button
                  className={cn(
                    `text-md flex cursor-pointer items-center gap-x-3 overflow-auto border px-4 py-2 ${selectedAccount === item ? "border-green-500" : "border-gray-500"}`,
                  )}
                  key={item.address}
                  onClick={() => {
                    setSelectedAccount(item);
                  }}
                  type="button"
                >
                  <div className={cn("flex flex-col items-start gap-1")}>
                    <span className="font-semibold">{item.meta.name}</span>
                    <p className={cn("text-sm font-thin text-gray-300")}>
                      {smallAddress(item.address, 17)}
                    </p>
                  </div>
                </button>
              ))}
              {!wallets.length && (
                <div
                  className={cn(
                    "flex h-full flex-col items-center justify-center gap-4 text-center text-sm text-gray-300",
                  )}
                >
                  <div className={cn("flex flex-col gap-2")}>
                    <p>
                      <b className={cn("text-red-500")}>No wallet found</b>.
                      Please install a Wallet extension or check permission
                      settings.
                    </p>
                  </div>
                  <p>
                    If you don&apos;t have a wallet, we recommend one of these:
                  </p>
                  <div className={cn("flex gap-3")}>
                    <Link
                      className={cn("text-blue-600")}
                      href="https://subwallet.app/"
                      rel="noreferrer"
                      target="_blank"
                    >
                      SubWallet
                    </Link>
                    <Link
                      className={cn("text-blue-600")}
                      href="https://polkadot.js.org/extension/"
                      rel="noreferrer"
                      target="_blank"
                    >
                      Polkadot JS
                    </Link>
                  </div>
                </div>
              )}
              <button
                className={cn(
                  `w-full border px-4 py-2 text-xl font-semibold ${selectedAccount ? "border-green-500 text-green-500" : "border-gray-500 text-gray-300"} transition hover:bg-white/5`,
                )}
                disabled={!selectedAccount}
                onClick={() => {
                  if (!selectedAccount) {
                    return;
                  }
                  handleWalletSelections(selectedAccount);
                }}
                type="button"
              >
                Connect Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
