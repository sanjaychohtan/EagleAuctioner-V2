package com.eagleauctioner.factory;

import com.eagleauctioner.entity.AuctionWinner;
import com.eagleauctioner.entity.AuctionLot;
import com.eagleauctioner.entity.BidderProfile;
import com.eagleauctioner.entity.Bid;


import java.time.Instant;

/**
 * Enterprise Factory pattern for centralizing snapshot creations to protect historical auction results.
 * Solves duplication in the settlement logic.
 */
public class WinnerSnapshotFactory {

    private static class SnapshotData {
        final String winnerCompanyName;
        final String winnerDisplayName;
        final String winnerAnonCode;
        final String sellerCompanyName;
        final String currency;
        final String taxProfile;

        SnapshotData(AuctionLot lot, BidderProfile bidder) {
            this.winnerCompanyName = bidder.getOrganization() != null && bidder.getOrganization().getOrganizationName() != null 
                    ? bidder.getOrganization().getOrganizationName() 
                    : "N/A";
            this.winnerDisplayName = bidder.getUser() != null && bidder.getUser().getFirstName() != null 
                    ? bidder.getUser().getFirstName() + " " + (bidder.getUser().getLastName() != null ? bidder.getUser().getLastName() : "") 
                    : "Anonymous Bidder";
            this.winnerAnonCode = "BIDDER-" + bidder.getId().toString().substring(0, 8).toUpperCase();
            
            String sellerCompany = "Enterprise Seller";
            String curr = lot.getCurrency() != null ? lot.getCurrency() : "INR";
            String tax = "STANDARD_GST";

            if (lot.getAuction() != null) {
                if (curr.equals("USD") && lot.getAuction().getCurrency() != null) {
                    curr = lot.getAuction().getCurrency();
                }
                
                if (lot.getAuction().getSellerProfile() != null && lot.getAuction().getSellerProfile().getCompany() != null) {
                    sellerCompany = lot.getAuction().getSellerProfile().getCompany().getCompanyName() != null 
                            ? lot.getAuction().getSellerProfile().getCompany().getCompanyName() 
                            : "Enterprise Seller";
                }
            }
            this.sellerCompanyName = sellerCompany;
            this.currency = curr;
            this.taxProfile = tax;
        }
    }

    /**
     * Populates snapshot properties on a builder chain.
     */
    public static AuctionWinner.AuctionWinnerBuilder populateSnapshots(
            AuctionWinner.AuctionWinnerBuilder builder,
            AuctionLot lot,
            BidderProfile bidder,
            Bid bid,
            Long winningAmount) {

        SnapshotData data = new SnapshotData(lot, bidder);

        return builder
                .winnerCompanyName(data.winnerCompanyName)
                .winnerDisplayName(data.winnerDisplayName)
                .winnerAnonymousCode(data.winnerAnonCode)
                .winnerBidAmountSnapshot(winningAmount)
                .winnerBidTimeSnapshot(bid != null ? bid.getBidTime() : Instant.now())
                .sellerCompanySnapshot(data.sellerCompanyName)
                .reservePriceSnapshot(lot.getReservePrice())
                .currencySnapshot(data.currency)
                .taxProfileSnapshot(data.taxProfile);
    }

    /**
     * Populates snapshot properties on an existing mutable AuctionWinner entity.
     */
    public static void populateSnapshotsOnInstance(
            AuctionWinner winner,
            AuctionLot lot,
            BidderProfile bidder,
            Bid bid,
            Long winningAmount) {

        SnapshotData data = new SnapshotData(lot, bidder);

        winner.setWinnerCompanyName(data.winnerCompanyName);
        winner.setWinnerDisplayName(data.winnerDisplayName);
        winner.setWinnerAnonymousCode(data.winnerAnonCode);
        winner.setWinnerBidAmountSnapshot(winningAmount);
        winner.setWinnerBidTimeSnapshot(bid != null ? bid.getBidTime() : Instant.now());
        winner.setSellerCompanySnapshot(data.sellerCompanyName);
        winner.setReservePriceSnapshot(lot.getReservePrice());
        winner.setCurrencySnapshot(data.currency);
        winner.setTaxProfileSnapshot(data.taxProfile);
    }
}
