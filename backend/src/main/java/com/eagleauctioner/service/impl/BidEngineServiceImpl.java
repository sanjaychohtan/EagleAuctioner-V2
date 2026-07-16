package com.eagleauctioner.service.impl;

import com.eagleauctioner.entity.AuctionLot;
import com.eagleauctioner.entity.Bid;
import com.eagleauctioner.entity.BidderProfile;
import com.eagleauctioner.enums.BidStatus;
import com.eagleauctioner.repository.BidRepository;
import com.eagleauctioner.service.BidEngineService;
import com.eagleauctioner.service.AuctionAutoExtensionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class BidEngineServiceImpl implements BidEngineService {

    private final BidRepository bidRepository;
    private final AuctionAutoExtensionService auctionAutoExtensionService;

    @Override
    public Bid processForwardBid(AuctionLot lot, BidderProfile bidder, Long bidAmount, String ipAddress, String userAgent) {
        Long currentHighest = lot.getCurrentHighestBid();
        Long minIncrement = lot.getMinimumIncrement();
        Long minRequired = currentHighest == null ? lot.getStartingPrice() : Math.addExact(currentHighest, minIncrement);

        if (bidAmount < minRequired) {
            throw new IllegalArgumentException("Bid amount must be at least " + minRequired);
        }

        Optional<Bid> prevWinningBidOpt = bidRepository.findWinningBid(lot.getId());
        
        if (prevWinningBidOpt.isPresent()) {
            Bid prevWinning = prevWinningBidOpt.get();
            if (prevWinning.getBidderProfile().getId().equals(bidder.getId())) {
                // Bidder is just increasing their maximum proxy limit
                Long currentMax = prevWinning.getAutoBidLimit() != null ? prevWinning.getAutoBidLimit() : prevWinning.getBidAmount();
                if (bidAmount <= currentMax) {
                    throw new IllegalArgumentException("New max bid must be higher than your current max bid");
                }
                prevWinning.setAutoBidLimit(bidAmount);
                prevWinning.setIsAutoBid(true);
                return bidRepository.save(prevWinning);
            } else {
                Long prevMax = prevWinning.getAutoBidLimit() != null ? prevWinning.getAutoBidLimit() : prevWinning.getBidAmount();
                
                if (bidAmount <= prevMax) {
                    // New bidder loses immediately due to existing proxy
                    Long nextBidAmt = bidAmount.equals(prevMax) ? prevMax : Math.addExact(bidAmount, minIncrement);
                    if (nextBidAmt > prevMax) nextBidAmt = prevMax;
                    
                    prevWinning.setBidAmount(nextBidAmt);
                    bidRepository.save(prevWinning);
                    lot.setCurrentHighestBid(nextBidAmt);
                    
                    // Trigger extension using current time (activation time)
                    String oldBidderAnon = "BIDDER-" + prevWinning.getBidderProfile().getId().toString().substring(0, 8).toUpperCase();
                    auctionAutoExtensionService.checkAndExtend(lot.getAuction().getId(), lot.getId(), Instant.now(), oldBidderAnon);

                    String anonymousCode = "BIDDER-" + bidder.getId().toString().substring(0, 8).toUpperCase();
                    Bid newBid = Bid.builder()
                            .auctionLot(lot)
                            .bidderProfile(bidder)
                            .bidAmount(bidAmount)
                            .bidTime(Instant.now())
                            .bidStatus(BidStatus.OUTBID)
                            .ipAddress(ipAddress)
                            .userAgent(userAgent)
                            .isAutoBid(false)
                            .anonymousBidderCode(anonymousCode)
                            .build();
                    return bidRepository.save(newBid);
                } else {
                    // New bidder outbids the previous proxy
                    Long nextBidAmt = Math.addExact(prevMax, minIncrement);
                    if (nextBidAmt > bidAmount) nextBidAmt = bidAmount;
                    
                    prevWinning.setBidStatus(BidStatus.OUTBID);
                    bidRepository.save(prevWinning);
                    
                    return createWinningBid(lot, bidder, nextBidAmt, bidAmount, ipAddress, userAgent);
                }
            }
        } else {
            return createWinningBid(lot, bidder, minRequired, bidAmount, ipAddress, userAgent);
        }
    }

    @Override
    public Bid processReverseBid(AuctionLot lot, BidderProfile bidder, Long bidAmount, String ipAddress, String userAgent) {
        Long currentHighest = lot.getCurrentHighestBid();
        Long minIncrement = lot.getMinimumIncrement();
        Long maxRequired = currentHighest == null ? lot.getStartingPrice() : Math.subtractExact(currentHighest, minIncrement);

        if (bidAmount > maxRequired) {
            throw new IllegalArgumentException("For reverse auctions, bid amount must be less than or equal to " + maxRequired);
        }

        Optional<Bid> prevWinningBidOpt = bidRepository.findWinningBid(lot.getId());
        
        if (prevWinningBidOpt.isPresent()) {
            Bid prevWinning = prevWinningBidOpt.get();
            if (prevWinning.getBidderProfile().getId().equals(bidder.getId())) {
                if (bidAmount >= prevWinning.getBidAmount()) {
                    throw new IllegalArgumentException("New reverse bid must be lower than your current bid");
                }
                prevWinning.setBidAmount(bidAmount);
                prevWinning.setBidTime(Instant.now());
                return bidRepository.save(prevWinning);
            } else {
                prevWinning.setBidStatus(BidStatus.OUTBID);
                bidRepository.save(prevWinning);
                return createWinningBid(lot, bidder, bidAmount, bidAmount, ipAddress, userAgent);
            }
        } else {
            return createWinningBid(lot, bidder, bidAmount, bidAmount, ipAddress, userAgent);
        }
    }

    @Override
    public Bid processSealedBid(AuctionLot lot, BidderProfile bidder, Long bidAmount, String ipAddress, String userAgent) {
        Long minRequired = lot.getStartingPrice();
        if (bidAmount < minRequired) {
            throw new IllegalArgumentException("Bid amount must be at least the starting price " + minRequired);
        }
        
        List<Bid> existingBids = bidRepository.findByLotIdAndBidderId(lot.getId(), bidder.getId());
        if (!existingBids.isEmpty()) {
            Bid existingBid = existingBids.get(0);
            existingBid.setBidAmount(bidAmount);
            existingBid.setBidTime(Instant.now());
            return bidRepository.save(existingBid);
        } else {
            String anonymousCode = "BIDDER-" + bidder.getId().toString().substring(0, 8).toUpperCase();
            Bid newBid = Bid.builder()
                    .auctionLot(lot)
                    .bidderProfile(bidder)
                    .bidAmount(bidAmount)
                    .bidTime(Instant.now())
                    .bidStatus(BidStatus.PLACED)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .isAutoBid(false)
                    .anonymousBidderCode(anonymousCode)
                    .build();
            return bidRepository.save(newBid);
        }
    }

    private Bid createWinningBid(AuctionLot lot, BidderProfile bidder, Long actualAmount, Long maxLimit, String ipAddress, String userAgent) {
        String anonymousCode = "BIDDER-" + bidder.getId().toString().substring(0, 8).toUpperCase();
        boolean isAutoBid = maxLimit != null && maxLimit > actualAmount;
        
        Bid newBid = Bid.builder()
                .auctionLot(lot)
                .bidderProfile(bidder)
                .bidAmount(actualAmount)
                .bidTime(Instant.now())
                .bidStatus(BidStatus.WINNING)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .isAutoBid(isAutoBid)
                .autoBidLimit(isAutoBid ? maxLimit : null)
                .anonymousBidderCode(anonymousCode)
                .build();
        return bidRepository.save(newBid);
    }
}
