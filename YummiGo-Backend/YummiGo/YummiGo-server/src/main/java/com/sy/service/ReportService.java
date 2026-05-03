package com.sy.service;

import com.sy.vo.TurnoverReportVO;

import java.time.LocalDate;

public interface ReportService {
    /**
     * ある時間帯の売り上げ統計
     * @param begin
     * @param end
     * @return
     */
    TurnoverReportVO getTurnoverStatistics(LocalDate begin, LocalDate end);
}
