import { useState, useEffect } from "react";
import Head from "next/head";
import { ethers } from "ethers";

import abi from "../artifacts/contracts/WavePortal.sol/WavePortal.json";
import styles from "../styles/Home.module.css";

export default function Home() {
  const [message, setMessage] = useState("");
  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const contractAddress = process.env.CONTRACT_ADDRESS;

  const getAllWaves = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.JsonRpcProvider();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          abi.abi,
          provider
        );

        const waves = await wavePortalContract.getAllWaves();
        let wavesCleaned = [];
        waves.forEach((wave) => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          });
        });

        setAllWaves(wavesCleaned);

        // wavePortalContract.on("NewWave", (from, timestamp, message) => {
        //   console.log("NewWave", from, timestamp, message);

        //   setAllWaves((prevState) => [
        //     ...prevState,
        //     {
        //       address: from,
        //       timestamp: new Date(timestamp * 1000),
        //       message: message,
        //     },
        //   ]);
        // });
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        setCurrentAccount(accounts[0]);
        console.log("Found an authorized account:", account);
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          abi.abi,
          signer
        );

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        const waveTxn = await wavePortalContract.wave(message);
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        getAllWaves();
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    getAllWaves();
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>Waveportal</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <h3>👋 Hey there!</h3>

      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Leave a message..."
        rows="5"
        cols="33"
      />

      <br />

      {!currentAccount ? (
        <button className="waveButton" onClick={connectWallet}>
          Connect Wallet
        </button>
      ) : (
        <button disabled={!message} onClick={() => wave()}>
          Leave a message!
        </button>
      )}

      {allWaves.map((wave, index) => {
        return (
          <div
            key={wave.timestamp + index}
            style={{
              backgroundColor: "OldLace",
              marginTop: "16px",
              padding: "8px",
            }}
          >
            <div>Address: {wave.address}</div>
            <div>Time: {wave.timestamp.toString()}</div>
            <div>Message: {wave.message}</div>
          </div>
        );
      })}
    </div>
  );
}
