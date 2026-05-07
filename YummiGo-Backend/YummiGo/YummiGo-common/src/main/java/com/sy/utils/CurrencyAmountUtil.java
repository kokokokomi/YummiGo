package com.sy.utils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

public final class CurrencyAmountUtil {
    private CurrencyAmountUtil() {}

    private static final Map<String, Integer> CURRENCY_SCALE = Map.ofEntries(
            Map.entry("jpy", 0),
            Map.entry("krw", 0),
            Map.entry("vnd", 0),
            Map.entry("xaf", 0),
            Map.entry("xof", 0),
            Map.entry("xpf", 0),
            Map.entry("usd", 2),
            Map.entry("eur", 2),
            Map.entry("gbp", 2),
            Map.entry("cny", 2)
    );

    public static int getScale(String currency) {
        String key = currency == null ? "jpy" : currency.toLowerCase();
        return CURRENCY_SCALE.getOrDefault(key, 2);
    }

    public static BigDecimal normalizeMajor(BigDecimal amount, String currency) {
        if (amount == null) return BigDecimal.ZERO;
        return amount.setScale(getScale(currency), RoundingMode.HALF_UP);
    }

    public static long toMinorUnit(BigDecimal amount, String currency) {
        BigDecimal normalized = normalizeMajor(amount, currency);
        int scale = getScale(currency);
        BigDecimal factor = BigDecimal.TEN.pow(scale);
        return normalized.multiply(factor).setScale(0, RoundingMode.HALF_UP).longValueExact();
    }
}

