import React, { useState } from 'react';
import { NFT as NFTType } from '@thirdweb-dev/sdk';
import styles from '../../styles/Sale.module.css';
import { Toaster, toast } from 'react-hot-toast';
import { Web3Button, useContractRead, useContract } from '@thirdweb-dev/react';
import toastStyle from '../../util/toastConfig';
import profileStyles from "../../styles/Profile.module.css";
import { NFT_COLLECTION_ADDRESS } from '../../const/contractAddresses';

type Props = {
  nft: NFTType;
};

export default function Stake({ nft }: Props) {
  const tokenId = nft.metadata.id;
  const [isLoading, setIsLoading] = useState(false);
  const { contract } = useContract(NFT_COLLECTION_ADDRESS);
  const { data: isStaked, isLoading: isCheckingStaked } = useContractRead(contract, "isStaked", [tokenId]);

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

  return (
    <>
      <Toaster position="bottom-center" reverseOrder={false} />

      {/* Conditionally render "Stake" or "Unstake" button based on smart contract state */}
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
    </>
  );
}
