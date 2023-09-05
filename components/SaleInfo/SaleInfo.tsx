import { NFT as NFTType } from "@thirdweb-dev/sdk";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import styles from "../../styles/Sale.module.css";
import profileStyles from "../../styles/Profile.module.css";
import {
  useContract,
  useContractRead,
  useCreateAuctionListing,
  useCreateDirectListing,
  Web3Button,
} from "@thirdweb-dev/react";
import {
  MARKETPLACE_ADDRESS,
  NFT_COLLECTION_ADDRESS,
} from "../../const/contractAddresses";
import { useRouter } from "next/router";
import toast, { Toaster } from "react-hot-toast";
import toastStyle from "../../util/toastConfig";

type Props = {
  nft: NFTType;
};

type AuctionFormData = {
  nftContractAddress: string;
  tokenId: string;
  startDate: Date;
  endDate: Date;
  floorPrice: string;
  buyoutPrice: string;
};

type DirectFormData = {
  nftContractAddress: string;
  tokenId: string;
  price: string;
  startDate: Date;
  endDate: Date;
};

export default function SaleInfo({ nft }: Props) {
  const router = useRouter();
  const { contract: marketplace } = useContract(MARKETPLACE_ADDRESS, "marketplace-v3");
  const { contract: nftCollection } = useContract(NFT_COLLECTION_ADDRESS);
  const tokenId = nft.metadata.id;
  const [isLoading, setIsLoading] = useState(false);
  const { data: isStaked, isLoading: isCheckingStaked } = useContractRead(
    nftCollection,
    "isStaked",
    [tokenId]
  );
  const { mutateAsync: createAuctionListing } = useCreateAuctionListing(marketplace);
  const { mutateAsync: createDirectListing } = useCreateDirectListing(marketplace);
  const [tab, setTab] = useState<"direct" | "auction" | "stake">(
    isStaked ? "stake" : "direct"
  );

  useEffect(() => {
    setTab(isStaked ? "stake" : "direct");
  }, [isStaked]);

  // Manage form values using react-hook-form library: Auction form
  const { register: registerAuction, handleSubmit: handleSubmitAuction } =
    useForm<AuctionFormData>({
      defaultValues: {
        nftContractAddress: NFT_COLLECTION_ADDRESS,
        tokenId: nft.metadata.id,
        startDate: new Date(),
        endDate: new Date(),
        floorPrice: "0",
        buyoutPrice: "0",
      },
    });

  // Manage form values using react-hook-form library: Direct form
  const { register: registerDirect, handleSubmit: handleSubmitDirect } =
    useForm<DirectFormData>({
      defaultValues: {
        nftContractAddress: NFT_COLLECTION_ADDRESS,
        tokenId: nft.metadata.id,
        startDate: new Date(),
        endDate: new Date(),
        price: "0",
      },
    });

  const handleStake = async (contract: any) => {
    setIsLoading(true);
    try {
      await contract.call("stake", [tokenId]);
      toast.success('Successfully staked!');
    } catch (error) {
      toast.error(`Failed to stake: ${onmessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnstake = async (contract: any) => {
    setIsLoading(true);
    try {
      await contract.call("unstake", [tokenId]);
      toast.success('Successfully unstaked!');
    } catch (error) {
      toast.error(`Failed to unstake: ${onmessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingStaked) {
    return <div>Loading...</div>; // or some loading spinner
  }

  // User requires to set marketplace approval before listing
  async function checkAndProvideApproval() {
    // Check if approval is required
    const hasApproval = await nftCollection?.call("isApprovedForAll", [
      nft.owner,
      MARKETPLACE_ADDRESS,
    ]);

    // If it is, provide approval
    if (!hasApproval) {
      const txResult = await nftCollection?.call("setApprovalForAll", [
        MARKETPLACE_ADDRESS,
        true,
      ]);

      if (txResult) {
        toast.success("Marketplace approval granted", {
          icon: "👍",
          style: toastStyle,
          position: "bottom-center",
        });
      }
    }

    return true;
  }

  async function handleSubmissionAuction(data: AuctionFormData) {
    await checkAndProvideApproval();
    const txResult = await createAuctionListing({
      assetContractAddress: data.nftContractAddress,
      tokenId: data.tokenId,
      buyoutBidAmount: data.buyoutPrice,
      minimumBidAmount: data.floorPrice,
      startTimestamp: new Date(data.startDate),
      endTimestamp: new Date(data.endDate),
    });

    return txResult;
  }

  async function handleSubmissionDirect(data: DirectFormData) {
    await checkAndProvideApproval();
    const txResult = await createDirectListing({
      assetContractAddress: data.nftContractAddress,
      tokenId: data.tokenId,
      pricePerToken: data.price,
      startTimestamp: new Date(data.startDate),
      endTimestamp: new Date(data.endDate),
    });

    return txResult;
  }

  return (
    <>
      <Toaster position="bottom-center" reverseOrder={false} />
      <div className={styles.saleInfoContainer} style={{ marginTop: -42 }}>
        <div className={profileStyles.tabs}>
          {/* Direct tab */}
          <h3
            className={`${profileStyles.tab} ${tab === "direct" ? profileStyles.activeTab : ""}`}
            onClick={() => {
              if (isStaked) {
                alert("You must unstake this token before listing.");
              } else {
                setTab("direct");
              }
            }}
            style={{ cursor: isStaked ? "not-allowed" : "pointer" }}
          >
            Direct
            {isStaked && <span style={{ marginLeft: 10, fontSize: '0.8em', color: 'red' }}>❗</span>}
          </h3>

          {/* Auction tab */}
          <h3
            className={`${profileStyles.tab} ${tab === "auction" ? profileStyles.activeTab : ""}`}
            onClick={() => {
              if (isStaked) {
                alert("You must unstake this token before listing.");
              } else {
                setTab("auction");
              }
            }}
            style={{ cursor: isStaked ? "not-allowed" : "pointer" }}
          >
            Auction
            {isStaked && <span style={{ marginLeft: 10, fontSize: '0.8em', color: 'red' }}>❗</span>}
          </h3>


          {/* Stake/Unstake tab */}
          <h3
            className={`${profileStyles.tab} ${tab === "stake" ? profileStyles.activeTab : ""}`}
            onClick={() => setTab("stake")}
          >
            {isStaked ? "Unstake" : "Stake"}
          </h3>


        </div>

        {/* Direct listing fields */}
        <div
          className={`${tab === "direct"
            ? styles.activeTabContent
            : profileStyles.tabContent
            }`}
          style={{ flexDirection: "column" }}
        >
          <h4 className={styles.formSectionTitle}>When </h4>

          {/* Input field for auction start date */}
          <legend className={styles.legend}> Listing Starts on </legend>
          <input
            className={styles.input}
            type="datetime-local"
            {...registerDirect("startDate")}
            aria-label="Auction Start Date"
          />

          {/* Input field for auction end date */}
          <legend className={styles.legend}> Listing Ends on </legend>
          <input
            className={styles.input}
            type="datetime-local"
            {...registerDirect("endDate")}
            aria-label="Auction End Date"
          />
          <h4 className={styles.formSectionTitle}>Price </h4>

          {/* Input field for buyout price */}
          <legend className={styles.legend}> Price per token</legend>
          <input
            className={styles.input}
            type="number"
            step={0.000001}
            {...registerDirect("price")}
          />

          <Web3Button
            contractAddress={MARKETPLACE_ADDRESS}
            action={async () => {
              await handleSubmitDirect(handleSubmissionDirect)();
            }}
            onError={(error) => {
              toast(`Listed Failed! Reason: ${error.cause}`, {
                icon: "❌",
                style: toastStyle,
                position: "bottom-center",
              });
            }}
            onSuccess={(txResult) => {
              toast("Listed Successfully!", {
                icon: "🥳",
                style: toastStyle,
                position: "bottom-center",
              });
              router.push(
                `/token/${NFT_COLLECTION_ADDRESS}/${nft.metadata.id}`
              );
            }}
          >
            Create Direct Listing
          </Web3Button>
        </div>

        {/* Auction listing fields */}
        <div
          className={`${tab === "auction"
            ? styles.activeTabContent
            : profileStyles.tabContent
            }`}
          style={{ flexDirection: "column" }}
        >
          <h4 className={styles.formSectionTitle}>When </h4>

          {/* Input field for auction start date */}
          <legend className={styles.legend}> Auction Starts on </legend>
          <input
            className={styles.input}
            type="datetime-local"
            {...registerAuction("startDate")}
            aria-label="Auction Start Date"
          />

          {/* Input field for auction end date */}
          <legend className={styles.legend}> Auction Ends on </legend>
          <input
            className={styles.input}
            type="datetime-local"
            {...registerAuction("endDate")}
            aria-label="Auction End Date"
          />
          <h4 className={styles.formSectionTitle}>Price </h4>

          {/* Input field for minimum bid price */}
          <legend className={styles.legend}> Allow bids starting from </legend>
          <input
            className={styles.input}
            step={0.000001}
            type="number"
            {...registerAuction("floorPrice")}
          />

          {/* Input field for buyout price */}
          <legend className={styles.legend}> Buyout price </legend>
          <input
            className={styles.input}
            type="number"
            step={0.000001}
            {...registerAuction("buyoutPrice")}
          />

          <Web3Button
            contractAddress={MARKETPLACE_ADDRESS}
            action={async () => {
              return await handleSubmitAuction(handleSubmissionAuction)();
            }}
            onError={(error) => {
              toast(`Listed Failed! Reason: ${error.cause}`, {
                icon: "❌",
                style: toastStyle,
                position: "bottom-center",
              });
            }}
            onSuccess={(txResult) => {
              toast("Listed Successfully!", {
                icon: "🥳",
                style: toastStyle,
                position: "bottom-center",
              });
              router.push(
                `/token/${NFT_COLLECTION_ADDRESS}/${nft.metadata.id}`
              );
            }}
          >
            Create Auction Listing
          </Web3Button>
        </div>

        {/* Stake */}
        <div
          className={`${tab === "stake"
            ? styles.activeTabContent
            : profileStyles.tabContent
            }`}
          style={{ flexDirection: "column" }}
        >

          {isStaked ? (
            <Web3Button
              contractAddress={NFT_COLLECTION_ADDRESS}
              action={handleUnstake}
              isDisabled={isLoading}
            >
              {isLoading ? 'Unstaking...' : 'Unstake'}
            </Web3Button>
          ) : (
            <Web3Button
              contractAddress={NFT_COLLECTION_ADDRESS}
              action={handleStake}
              isDisabled={isLoading}
            >
              {isLoading ? 'Staking...' : 'Stake'}
            </Web3Button>
          )}
        </div>
      </div>
    </>
  );
}
