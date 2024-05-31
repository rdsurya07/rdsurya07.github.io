// const Web3 = require('web3');

document.addEventListener("DOMContentLoaded", async () => {
  const detectEthereumProvider = window.detectEthereumProvider;
  const connectWalletButton = document.getElementById("connectWalletButton");
  const walletInfo = document.getElementById("txtWalletDetail");
  let web3_wallet;
  let userAccount;

  let arrContractObj = [];

  // Replace with your public RPC endpoint URL
  const publicRpcUrl = "https://rpc-amoy.polygon.technology/"; // Replace with your public RPC URL
  /*
  list of rpc
  
  */
  const web3 = new Web3(new Web3.providers.HttpProvider(publicRpcUrl));
  const ardTokenContract = new web3.eth.Contract(dexTokenABI, ardTokenAddress);
  const dexPoolContract = new web3.eth.Contract(
    dexContractAbi,
    dexContractAddress
  );
  const danlyTokenContract = new web3.eth.Contract(
    dexTokenABI,
    danlyTokenAddress
  );
  const kevinTokenContract = new web3.eth.Contract(
    dexTokenABI,
    kevinTokenAddress
  );
  const arrTokenContract = [
    ardTokenContract,
    danlyTokenContract,
    kevinTokenContract,
  ];
  const arrTokenContractAddress = [
    ardTokenAddress,
    danlyTokenAddress,
    kevinTokenAddress,
  ];

  var sections = document.querySelectorAll(".content-section");
  var links = document.querySelectorAll(".nav-link");

  function showSection(targetId) {
    sections.forEach(function (section) {
      if (section.id === targetId) {
        section.style.display = "block";
      } else {
        section.style.display = "none";
      }
    });
  }

  links.forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      var targetId = this.getAttribute("data-target");
      showSection(targetId);
    });
  });

  // Initially hide all sections except the first one
  showSection("pool-monitor");

  connectWalletButton.addEventListener("click", async () => {
    const provider = await detectEthereumProvider();

    if (provider) {
      try {
        // Request account access if needed
        await provider.request({ method: "eth_requestAccounts" });

        // Initialize web3
        web3_wallet = new Web3(provider);

        // Get the user's wallet address
        const accounts = await web3_wallet.eth.getAccounts();
        userAccount = accounts[0];

        // Get the user's ETH balance
        const balanceWei = await web3_wallet.eth.getBalance(userAccount);
        const balanceEth = web3_wallet.utils.fromWei(balanceWei, "ether");

        // Display the wallet info
        connectWalletButton.style.display = "none";
        walletInfo.innerHTML = `
            <p><b>Wallet Address:</b> ${userAccount}</p>
            <p><b>Balance:</b> ${balanceEth} MATIC</p>
          `;
      } catch (error) {
        console.error("Error connecting to MetaMask", error);
      }
    } else {
      alert("MetaMask is not installed. Please install it to use this app.");
    }
  });

  async function getBalance() {
    arrContractObj = [];
    let address = dexContractAddress;
    let poolInfo = document.getElementById("divPoolInnerCardContent");
    let strContent = ``;
    try {
      for (let i = 0; i < arrTokenContract.length; i++) {
        let contractObj = {};
        let tokenContract = arrTokenContract[i];
        const balance = await tokenContract.methods.balanceOf(address).call();
        const tokenName = await tokenContract.methods.name(address).call();
        const tokenSymbol = await tokenContract.methods.symbol(address).call();

        contractObj.tokenName = tokenName;
        contractObj.tokenSymbol = tokenSymbol;
        contractObj.tokenBalance = web3.utils.fromWei(balance, "ether");
        contractObj.tokenAddress = arrTokenContractAddress[i];
        contractObj.tokenContract = tokenContract;

        arrContractObj.push(contractObj);

        strContent += `
        <div class="col-sm-4">
            <div class="card">
                <div class="card-body">
                    <p class="card-text"><b>Token Name: </b>${tokenName}</p>
                    <p class="card-text"><b>Balance: </b>${web3.utils.fromWei(
                      balance,
                      "ether"
                    )}</p>
                    <p class="card-text"><b>Symbol: </b>${tokenSymbol}</p>
                </div>
            </div>
        </div>`;
      } //end loop

      poolInfo.innerHTML = strContent;
      refresh_pool_list();
    } catch (error) {
      console.error("Error getting balance:", error);
    }
  }

  getBalance();

  function refresh_pool_list() {
    let strSelect = ``;
    for (let i = 0; i < arrContractObj.length; i++) {
      strSelect += `<option val=${i}>${arrContractObj[i].tokenName} (${arrContractObj[i].tokenSymbol}): ${arrContractObj[i].tokenBalance}</option>`;
    }
    document.getElementById("poolSelect").innerHTML = strSelect;
    document.getElementById("fromPoolSelect").innerHTML = strSelect;
    document.getElementById("toPoolSelect").innerHTML = strSelect;
  }

  document
    .getElementById("btnPoolReload")
    .addEventListener("click", (event) => {
      console.log(arrTokenContract);
      console.log("Your account address is: " + userAccount);

      getBalance();
    });

  document
    .getElementById("btnAssetReload")
    .addEventListener("click", (event) => {
      if (userAccount === undefined) alert("Please connect your wallet first!");
      else {
        getAssetBalance();
      }
    });

  async function getAssetBalance() {
    let address = userAccount;
    let poolInfo = document.getElementById("divAssetInnerCardContent");
    let strContent = ``;
    try {
      for (let i = 0; i < arrTokenContract.length; i++) {
        let tokenContract = arrTokenContract[i];
        const balance = await tokenContract.methods.balanceOf(address).call();
        const tokenName = await tokenContract.methods.name(address).call();
        const tokenSymbol = await tokenContract.methods.symbol(address).call();
        strContent += `
            <div class="col-sm-4">
                <div class="card">
                    <div class="card-body">
                        <p class="card-text"><b>Token Name: </b>${tokenName}</p>
                        <p class="card-text"><b>Balance: </b>${web3.utils.fromWei(
                          balance,
                          "ether"
                        )}</p>
                        <p class="card-text"><b>Symbol: </b>${tokenSymbol}</p>
                    </div>
                </div>
            </div>`;
      } //end loop

      poolInfo.innerHTML = strContent;
    } catch (error) {
      console.error("Error getting balance:", error);
    }
  }

  async function approveSpender(
    tokenContract,
    spenderAddress,
    tokenAddress,
    amount
  ) {
    if (!userAccount) {
      console.error("No account connected");
      return;
    }

    // tokenContract = new web3.eth.Contract(erc20Abi, tokenAddress);
    // const spenderAddress = '0xSpenderAddress'; // Replace with the spender's address
    // const amount = "100"; // Amount to approve

    try {
      const data = tokenContract.methods
        .approve(spenderAddress, web3.utils.toWei(amount, "ether"))
        .encodeABI();

      const transactionParameters = {
        to: tokenAddress,
        from: userAccount,
        data: data,
      };

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [transactionParameters],
      });

      console.log("Transaction hash:", txHash);

      // Update modal text and link
      const etherscanUrl = `https://www.oklink.com/amoy/${txHash}`;
      let leContent = `
      <p>Transaction ${txHash} sent! View it on Block Scanner:</p>
      <p><a href="${etherscanUrl}">View</a></p>
      `;

      addLiquidity(tokenAddress, amount, spenderAddress);
    } catch (error) {
      console.error("Error approving spender:", error);
    }
  }

  async function addLiquidity(tokenAddress, amount, poolAddress) {
    if (!userAccount) {
      console.error("No account connected");
      return;
    }

    try {
      const data = dexPoolContract.methods
        .addLiquidity(tokenAddress, web3.utils.toWei(amount, "ether"))
        .encodeABI();

      const transactionParameters = {
        to: poolAddress,
        from: userAccount,
        data: data,
      };

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [transactionParameters],
      });

      console.log("Transaction hash:", txHash);

      // Update modal text and link
      const etherscanUrl = `https://www.oklink.com/amoy/${txHash}`;
      alert("View your transaction at " + etherscanUrl);
      document.getElementById("formAddLiquidity").reset();
      getBalance();
    } catch (error) {
      console.error("Error approving spender:", error);
    }
  }

  document
    .getElementById("btnAddLiquidity")
    .addEventListener("click", (event) => {
      let poolSelect = document.getElementById("poolSelect");
      let selectedPoolindex = poolSelect.selectedIndex;
      let amount = document.getElementById("inputLiquidityAmount").value;
      console.log(amount);
      console.log(selectedPoolindex);
      console.log(arrContractObj[selectedPoolindex]);

      let leContract = arrContractObj[selectedPoolindex];

      approveSpender(
        leContract.tokenContract,
        dexContractAddress,
        leContract.tokenAddress,
        amount
      );
    });

  async function getPrice(
    fromAddress,
    toAddress,
    fromTokenSymbol,
    toTokenSymbol
  ) {
    try {
      const price = await dexPoolContract.methods
        .getSwapPrice(fromAddress, toAddress, web3.utils.toWei(1, "ether"))
        .call();
      let strPriceInfo = `1 ${fromTokenSymbol} token is equivalent to ${web3.utils.fromWei(
        price,
        "ether"
      )} ${toTokenSymbol} token.`;
      alert(strPriceInfo);
    } catch (error) {
      console.error("Error:" + error);
    }
  }

  document.getElementById("btnGetPrice").addEventListener("click", (event) => {
    let selectedFromindex =
      document.getElementById("fromPoolSelect").selectedIndex;
    fromContract = arrContractObj[selectedFromindex];

    let selectedToindex = document.getElementById("toPoolSelect").selectedIndex;
    toContract = arrContractObj[selectedToindex];

    getPrice(
      fromContract.tokenAddress,
      toContract.tokenAddress,
      fromContract.tokenSymbol,
      toContract.tokenSymbol
    );
  });

  document.getElementById("btnSwap").addEventListener("click", (e) => {
    let selectedFromindex =
      document.getElementById("fromPoolSelect").selectedIndex;
    fromContract = arrContractObj[selectedFromindex];

    let selectedToindex = document.getElementById("toPoolSelect").selectedIndex;
    toContract = arrContractObj[selectedToindex];

    let amount = document.getElementById("inputAmountToSwap").value;

    // swap(fromContract.tokenAddress, toContract.tokenAddress, amount);
    approveSwap(fromContract, toContract, amount);
  });

  async function approveSwap(fromContract, toContract, amount) {
    if (!userAccount) {
      console.error("No account connected");
      return;
    }

    // tokenContract = new web3.eth.Contract(erc20Abi, tokenAddress);
    // const spenderAddress = '0xSpenderAddress'; // Replace with the spender's address
    // const amount = "100"; // Amount to approve
    let tokenContract = fromContract.tokenContract;
    let spenderAddress = dexContractAddress;
    let tokenAddress = fromContract.tokenAddress;

    try {
      const data = tokenContract.methods
        .approve(spenderAddress, web3.utils.toWei(amount, "ether"))
        .encodeABI();

      const transactionParameters = {
        to: tokenAddress,
        from: userAccount,
        data: data,
      };

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [transactionParameters],
      });

      console.log("Transaction hash:", txHash);

      // Update modal text and link
      const etherscanUrl = `https://www.oklink.com/amoy/${txHash}`;
      let leContent = `
      <p>Transaction ${txHash} sent! View it on Block Scanner:</p>
      <p><a href="${etherscanUrl}">View</a></p>
      `;

      swap(fromContract.tokenAddress, toContract.tokenAddress, amount);
    } catch (error) {
      console.error("Error approving spender:", error);
    }
  }

  async function swap(fromAddress, toAddress, amount) {
    if (!userAccount) {
      console.error("No account connected");
      return;
    }

    try {
      const data = dexPoolContract.methods
        .swap(fromAddress, toAddress, web3.utils.toWei(amount, "ether"))
        .encodeABI();

      const transactionParameters = {
        to: dexContractAddress,
        from: userAccount,
        data: data,
      };

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [transactionParameters],
      });

      console.log("Transaction hash:", txHash);

      // Update modal text and link
      const etherscanUrl = `https://www.oklink.com/amoy/${txHash}`;
      alert("View your transaction at " + etherscanUrl);
      document.getElementById("formSwap").reset();
      getBalance();
      getAssetBalance();
    } catch (error) {
      console.error("Error swapping spender:", error);
    }
  }
});
