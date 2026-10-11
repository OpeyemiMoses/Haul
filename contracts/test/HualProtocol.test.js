const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HUAL Protocol: Onchain Commerce, Escrow & Product Passports", function () {
  let usdc;
  let passport;
  let escrow;
  let commerce;
  let deployer, merchant, buyer, secondaryBuyer;

  beforeEach(async function () {
    [deployer, merchant, buyer, secondaryBuyer] = await ethers.getSigners();

    // 1. Deploy TestUSDC
    const TestUSDC = await ethers.getContractFactory("TestUSDC");
    usdc = await TestUSDC.deploy();
    await usdc.waitForDeployment();

    // 2. Deploy HualPassport
    const HualPassport = await ethers.getContractFactory("HualPassport");
    passport = await HualPassport.deploy();
    await passport.waitForDeployment();

    // 3. Deploy HualEscrow
    const HualEscrow = await ethers.getContractFactory("HualEscrow");
    escrow = await HualEscrow.deploy(await usdc.getAddress());
    await escrow.waitForDeployment();

    // 4. Deploy HualCommerce
    const HualCommerce = await ethers.getContractFactory("HualCommerce");
    commerce = await HualCommerce.deploy(
      await usdc.getAddress(),
      await passport.getAddress(),
      await escrow.getAddress()
    );
    await commerce.waitForDeployment();

    // 5. Wire permissions
    await passport.setAuthorizedController(await commerce.getAddress(), true);
    await escrow.setCommerceContract(await commerce.getAddress());

    // 6. Fund buyer with 5,000 USDC
    const fiveThousandUsdc = 5000n * 10n ** 6n;
    await usdc.mint(buyer.address, fiveThousandUsdc);
  });

  it("Should list products onchain and allow discovery", async function () {
    const tx = await commerce.connect(merchant).listProduct(
      "Sony WH-1000XM5",
      "Sony Electronics",
      "Audio",
      "https://example.com/headphones.jpg",
      "Premium noise-canceling headphones",
      25000, // $250.00
      365 * 24 * 3600, // 1 year warranty
      10, // stock
      true, // allows pickup
      true // allows delivery
    );
    await tx.wait();

    const products = await commerce.getAllActiveProducts();
    expect(products.length).to.equal(1);
    expect(products[0].name).to.equal("Sony WH-1000XM5");
    expect(products[0].priceUsdCents).to.equal(25000);
    expect(products[0].stock).to.equal(10);
    expect(products[0].merchant).to.equal(merchant.address);
  });

  it("Should lock buyer USDC into escrow and mint a living Product Passport upon checkout", async function () {
    // 1. Merchant lists product ($250.00)
    await commerce.connect(merchant).listProduct(
      "Fujifilm X100VI",
      "Fujifilm",
      "Optics",
      "https://example.com/camera.jpg",
      "Digital Camera",
      25000,
      2 * 365 * 24 * 3600,
      5,
      true,
      true
    );

    const secretPIN = "8421";
    const secretHash = ethers.keccak256(ethers.toUtf8Bytes(secretPIN));

    // 2. Buyer approves USDC
    const expectedUsdc = 250n * 10n ** 6n;
    await usdc.connect(buyer).approve(await commerce.getAddress(), expectedUsdc);

    // 3. Buyer creates order
    const orderTx = await commerce.connect(buyer).createOrder(
      1, // productId
      buyer.address,
      true, // isPickup
      secretHash,
      "SN-FUJI-991",
      "ipfs://bafybeihual"
    );
    await orderTx.wait();

    // 4. Verify Escrow holds the USDC
    const escrowBalance = await usdc.balanceOf(await escrow.getAddress());
    expect(escrowBalance).to.equal(expectedUsdc);

    // 5. Verify stock decremented
    const products = await commerce.getAllActiveProducts();
    expect(products[0].stock).to.equal(4);

    // 6. Verify buyer owns the minted passport in PAID state
    const buyerPassports = await passport.getPassportsByOwner(buyer.address);
    expect(buyerPassports.length).to.equal(1);
    expect(buyerPassports[0].currentState).to.equal(1); // PAID
    expect(buyerPassports[0].originalPriceUsdCents).to.equal(25000);
  });

  it("Should execute in-store pickup: verify customer PIN, release escrow to merchant, and mark passport COLLECTED", async function () {
    await commerce.connect(merchant).listProduct(
      "Seiko Prospex Diver",
      "Seiko",
      "Watches",
      "https://example.com/watch.jpg",
      "Diver Watch",
      35000, // $350.00
      3 * 365 * 24 * 3600,
      2,
      true,
      false
    );

    const secretPIN = "4921";
    const secretHash = ethers.keccak256(ethers.toUtf8Bytes(secretPIN));
    const amountUsdc = 350n * 10n ** 6n;

    await usdc.connect(buyer).approve(await commerce.getAddress(), amountUsdc);
    await commerce.connect(buyer).createOrder(
      1,
      buyer.address,
      true,
      secretHash,
      "SN-SEIKO-882",
      "ipfs://seiko"
    );

    // Merchant marks ready for pickup
    await commerce.connect(merchant).markOrderReady(1);
    let passData = await passport.passports(1);
    expect(passData.currentState).to.equal(2); // READY_FOR_PICKUP

    // Merchant tries invalid PIN
    await expect(
      commerce.connect(merchant).completePickupHandover(1, "0000")
    ).to.be.revertedWith("HualCommerce: Invalid customer pickup PIN");

    // Merchant submits correct PIN
    const merchantBalanceBefore = await usdc.balanceOf(merchant.address);
    await commerce.connect(merchant).completePickupHandover(1, "4921");

    // Escrow released to merchant
    const merchantBalanceAfter = await usdc.balanceOf(merchant.address);
    expect(merchantBalanceAfter - merchantBalanceBefore).to.equal(amountUsdc);

    // Passport updated to COLLECTED
    passData = await passport.passports(1);
    expect(passData.currentState).to.equal(4); // COLLECTED
  });

  it("Should execute delivery order: customer confirms receipt to release escrow", async function () {
    await commerce.connect(merchant).listProduct(
      "Aether Sneakers",
      "Aether",
      "Footwear",
      "https://example.com/shoe.jpg",
      "Cyber-knit sneakers",
      19500, // $195.00
      180 * 24 * 3600,
      4,
      false, // no pickup
      true // delivery only
    );

    const amountUsdc = 195n * 10n ** 6n;
    await usdc.connect(buyer).approve(await commerce.getAddress(), amountUsdc);
    await commerce.connect(buyer).createOrder(
      1,
      buyer.address,
      false, // delivery
      ethers.ZeroHash,
      "SN-AETH-401",
      "ipfs://aether"
    );

    // Merchant dispatches delivery
    await commerce.connect(merchant).dispatchDelivery(1);
    let passData = await passport.passports(1);
    expect(passData.currentState).to.equal(3); // IN_TRANSIT

    // Escrow still held
    const escrowBalance = await usdc.balanceOf(await escrow.getAddress());
    expect(escrowBalance).to.equal(amountUsdc);

    // Customer confirms receipt upon delivery
    const merchantBalanceBefore = await usdc.balanceOf(merchant.address);
    await commerce.connect(buyer).confirmDelivery(1);

    // Escrow released
    const merchantBalanceAfter = await usdc.balanceOf(merchant.address);
    expect(merchantBalanceAfter - merchantBalanceBefore).to.equal(amountUsdc);

    passData = await passport.passports(1);
    expect(passData.currentState).to.equal(4); // COLLECTED
  });

  it("Should refund buyer in USDC and restore stock upon order cancellation", async function () {
    await commerce.connect(merchant).listProduct(
      "Item for Cancel",
      "Brand",
      "General",
      "https://example.com/item.jpg",
      "Item",
      10000, // $100.00
      30 * 24 * 3600,
      1,
      true,
      true
    );

    const amountUsdc = 100n * 10n ** 6n;
    await usdc.connect(buyer).approve(await commerce.getAddress(), amountUsdc);
    await commerce.connect(buyer).createOrder(
      1,
      buyer.address,
      true,
      ethers.ZeroHash,
      "SN-CANCEL-1",
      "ipfs://item"
    );

    const buyerBalanceBefore = await usdc.balanceOf(buyer.address);
    // Merchant cancels and refunds
    await commerce.connect(merchant).cancelAndRefundOrder(1);

    const buyerBalanceAfter = await usdc.balanceOf(buyer.address);
    expect(buyerBalanceAfter - buyerBalanceBefore).to.equal(amountUsdc);

    const products = await commerce.getAllActiveProducts();
    expect(products[0].stock).to.equal(1); // Stock restored

    const passData = await passport.passports(1);
    expect(passData.currentState).to.equal(8); // REFUNDED
  });

  it("Should allow buyer to transfer passport to secondary owner with audit history", async function () {
    await commerce.connect(merchant).listProduct(
      "Resellable Camera",
      "Brand",
      "Optics",
      "https://example.com/camera.jpg",
      "Camera",
      10000,
      365 * 24 * 3600,
      1,
      true,
      true
    );

    const amountUsdc = 100n * 10n ** 6n;
    await usdc.connect(buyer).approve(await commerce.getAddress(), amountUsdc);
    await commerce.connect(buyer).createOrder(
      1,
      buyer.address,
      true,
      ethers.ZeroHash,
      "SN-TRANS-1",
      "ipfs://camera"
    );

    // Buyer transfers passport to secondary buyer
    await passport.connect(buyer).transferPassport(1, secondaryBuyer.address);

    const secondaryPassports = await passport.getPassportsByOwner(secondaryBuyer.address);
    expect(secondaryPassports.length).to.equal(1);
    expect(secondaryPassports[0].transferCount).to.equal(1);
    expect(secondaryPassports[0].currentState).to.equal(7); // TRANSFERRED

    const history = await passport.getLifecycleHistory(1);
    expect(history.length).to.equal(2); // PAID -> TRANSFERRED
  });

  it("Should log a warranty repair event without invalidating ownership", async function () {
    await commerce.connect(merchant).listProduct(
      "Warrantied Watch",
      "Brand",
      "Watches",
      "https://example.com/watch.jpg",
      "Watch",
      10000,
      365 * 24 * 3600,
      1,
      true,
      true
    );

    const amountUsdc = 100n * 10n ** 6n;
    await usdc.connect(buyer).approve(await commerce.getAddress(), amountUsdc);
    await commerce.connect(buyer).createOrder(
      1,
      buyer.address,
      true,
      ethers.ZeroHash,
      "SN-WARRANTY-1",
      "ipfs://watch"
    );

    await passport.connect(buyer).recordWarrantyEvent(1, "Battery replacement under 12-month manufacturer warranty");

    const passData = await passport.passports(1);
    expect(passData.currentState).to.equal(6); // UNDER_SERVICE

    const history = await passport.getLifecycleHistory(1);
    expect(history.length).to.equal(2);
    expect(history[1].note).to.equal("Battery replacement under 12-month manufacturer warranty");
  });
});
