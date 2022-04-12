import Head from "next/head"
import styles from "../styles/Home.module.css"
import web3modal from "web3modal"
import { providers, Contract } from "ethers"
import { useEffect, useRef, useState } from "react"
import { WHITELIST_CONTRACT_ADDRESS } from "../constants/contracts"
import data from "../constants/Whitelist.json"
const abi = data.abi

export default function Home() {
  // *    To check whether the wallet is connected or not of user
  const [walletConnected, setWalletConnected] = useState(false)
  // ^    To check whether the current address has joined the whitelist or not
  const [joinedWhitelist, setJoinedWhitelist] = useState(false)
  // *    To check the number of address whitelisted
  const [numberofWhitelist, setNumberofWhitelist] = useState(0)
  // ?    To check the transaction is complete or not so for waiting
  const [waiting, setWaiting] = useState(false)
  // ^    It is used to connect metamask wallet as long as it is open
  const web3ModalRef = useRef()

  /* 
  !     Returns a Provider or Signer object which represent the Ethereum RPC with or without the
  &     Signing capabilities of metamask
  *     Provider :- It is used to interact with blockchain  like -reading transactions , reading balances , reading state , etc ..
  ^     Signer :- It is a special type of provider used to write transactions which is to be made on blockchain
  ^              It involves metamask account connection to make a digital signature to authorize the transaction being sent
  ^              Metamask shows a signer API to allow website to request signature from the user using Signer function
  !     needSigner is set to true if we need signer , By default it is false
  */

  const getProviderOrSigner = async (needSigner = false) => {
    //  *   Connect to metamsk
    //  *   We store web3modal as a reference, We need to access the current value to get the access the underlying object

    const provider = await web3ModalRef.current.connect()
    const Web3Provider = new providers.Web3Provider(provider)

    //  ^   If the user is not connected to the Rinkeby network let them know and throw an error
    const { chainId } = await Web3Provider.getNetwork()
    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby")
      throw new Error("Change network to Rinkeby")
    }

    if (needSigner) {
      const signer = Web3Provider.getSigner()
      return signer
    }
    return Web3Provider
  }

  // ^  addAddresstowhitlelist : It adds the current connected address to the whitelist

  const addAddressToWhitelist = async () => {
    try {
      // *     It is a transaction so here we will need signer
      const signer = await getProviderOrSigner(true)
      // ^    Create a new instance of the Contract with a Signer which allow to update methods
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer
      )

      // &    Calling addAddresstoWhitelist function from the contract
      const tx = await whitelistContract.addWhiteListAddress()
      setWaiting(true)
      // *    We will wait for transaction to get complete.
      await tx.wait()
      setWaiting(false)
      // ^      We will get the updated number of addresses in the whitelist
      await getNumberOfWhitelisted()
      setJoinedWhitelist(true)
    } catch (err) {
      console.error(err)
    }
  }

  /*
   *  getNumberofWhitelisted :- It will get the number of white listed addresses
   */

  const getNumberOfWhitelisted = async () => {
    try {
      // ! Here we only need Provider as there is not transaction included
      const provider = await getProviderOrSigner()
      // We connect to the contract using a Provider so will only have read access to the Contract
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        provider
      )

      // Call the numWhiteAddresses function from the contract
      const _numberOfWhitelist = await whitelistContract.numWhiteAddresses()
      setNumberofWhitelist(_numberOfWhitelist)
    } catch (err) {
      console.error(err)
    }
  }

  //  !  Check If the address is in the whitelist or not
  const checkIfAddressInWhitelist = async () => {
    try {
      // We will need signer here to get the address
      // As its only read function but we can use signer as they are also providers
      const signer = await getProviderOrSigner(true)
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer
      )
      // We will fetch the address which is connected to the metamask
      const address = await signer.getAddress()
      // call the whitelistedAddress from the contract
      const _joinedWhitelist = await whitelistContract.whitelistedAddress(
        address
      )
      setJoinedWhitelist(_joinedWhitelist)
    } catch (err) {
      console.error(err)
    }
  }

  // !   Connecting Wallet
  const connectWallet = async () => {
    try {
      // Get the provider from web3modal
      // When used for first time it will ask to connect the wallet to the user
      await getProviderOrSigner()
      setWalletConnected(true)

      checkIfAddressInWhitelist()
      getNumberOfWhitelisted()
    } catch (err) {
      console.error(err)
    }
  }

  //  Rendering a BUtton

  const renderButton = () => {
    if (walletConnected) {
      if (joinedWhitelist) {
        return (
          <div className={styles.description}>
            Thanks for joining the Whitelist.
          </div>
        )
      } else if (waiting) {
        return <button className={styles.button}>Loading...</button>
      } else {
        return (
          <button onClick={addAddressToWhitelist} className={styles.button}>
            Join the Whitelist
          </button>
        )
      }
    } else {
      return (
        <button className={styles.button} onClick={connectWallet}>
          Connect your Wallet
        </button>
      )
    }
  }

  // useEffect is used to react on changes in the state of website
  // The array at the end of the function call represent that which change will trigger this effect
  // So here whenever the walletConnected  changes the effect will be triggered
  useEffect(() => {
    if (!walletConnected) {
      // Assigning the Web3 Modal class to the reference object by setting current value
      // The current value will remain till the page is open
      web3ModalRef.current = new web3modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      })
      connectWallet()
    }
  }, [walletConnected])

  return (
    <div>
      <Head>
        <title>Whitelist Dapp</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!!🙏🏻</h1>
          <div className={styles.description}>
            Its an NFT collection for developers in Crypto.
          </div>
          <div className={styles.description}>
            {numberofWhitelist} have already joined the Whitelist.
          </div>
          {renderButton()}
        </div>
        <div>
          <img
            src="https://res.cloudinary.com/krotcloud/image/upload/v1649618916/crypto-devs_mthhbd.svg"
            alt=""
            className={styles.image}
          />
        </div>
      </div>
      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs @Yash Patel
      </footer>
    </div>
  )
}
