import React, { useState } from "react";
import PropTypes from "prop-types";
import "./Home.css";
import { useNavigate } from "react-router-dom";
import useConnectWallet, { useWallet } from "../Hooks/useConnectWallet";
import CheckLogin from "../CheckLogin/CheckLogin";

const Drawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
   // wallet Login 
   const { walletAddress, user, ethBalance, ethBalanceUsdt, connectWallet } = useWallet();

  if (!isOpen) return null;

  return (
    <div
      className={`drawer-backdrop ${isOpen ? "active" : ""}`}
      onClick={onClose}
      style={{ zIndex: '10' }}
    >
      <div className={`drawer ${isOpen ? "active" : ""}`} onClick={(e) => e.stopPropagation()}>
        <button className="close-drawer-btn" onClick={onClose}>
          ✕
        </button>
        <ul className="text-left ">
          <li className="" onClick={() => {
            navigate("/");
            onClose();
          }}>Home</li>
          <li className="" onClick={() => {
            navigate("/about-us");
            onClose();
          }}>About Us</li>
          {/* <li className="" onClick={() => {
                navigate("/contact-us"); 
                onClose();
              }}>Contact Us</li> */}

          <li className="" onClick={() => { navigate("/pricing"); onClose() }}>Pricing</li>
          <li className="" onClick={() => { navigate("/how-it-works"); onClose() }}>How It Works</li>
          <li className="" onClick={() => { navigate("/faqs"); onClose() }}>Faqs</li>
          <li className="" onClick={() => { navigate("/past-opportunities"); onClose() }}>Past Opportunities</li>
          {/* <li className="" onClick={() => {navigate("/auto-bot"); onClose()}}>Auto BOT</li> */}
          <li className=""
            // style={{color: '#F0A500'}} 
            onClick={() => {
              navigate("/token-bot");
              onClose();
            }}>Token Bot</li>

          <li className=""
            // style={{color: '#F0A500'}} 
            onClick={() => {
              navigate("/opportunity-bot");
              onClose();
            }}>Opportunity Bot</li>
          <CheckLogin register={"code"}>            
          {!user?.walletAddress ?<li className="btn" onClick={() => { 
            // navigate("/wallet-login");
            // connectWallet(); 
            onClose() }}
            style={{
              background: 'linear-gradient(45deg, #5B86E5, #36D1DC)', // Stylish gradient for the button
              color: '#FFFFFF',
              padding: '8px',
              fontSize: '12px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: '0.3s ease',
              boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.3)',
            }}
            >Wallet Login</li>
            :
            <li 
            style={{
              background: 'linear-gradient(45deg, #5B86E5, #36D1DC)', // Stylish gradient for the button
              color: '#FFFFFF',
              padding: '8px',
              fontSize: '12px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: '0.3s ease',
              boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.3)',
            }}
            // style={{color: 'orange'}} 
            className="btn" onClick={() => { navigate("/dashboard"); onClose() }}>{user?.walletAddress ? `${user?.walletAddress.slice(0, 5)}...` : "No Wallet Address"}</li>
          }
          </CheckLogin>
        </ul>
      </div>
    </div>
  );
};

export default Drawer;
