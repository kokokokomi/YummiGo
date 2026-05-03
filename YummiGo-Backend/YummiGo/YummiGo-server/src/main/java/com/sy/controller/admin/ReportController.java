package com.sy.controller.admin;

import com.sy.result.Result;
import com.sy.service.ReportService;
import com.sy.vo.OrderReportVO;
import com.sy.vo.TurnoverReportVO;
import com.sy.vo.UserReportVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;

@RestController("adminReportController")
@RequestMapping("admin/report")
@Slf4j
@Tag(name = "A-Report-API")
public class ReportController {

    @Autowired
    private ReportService reportService;

    /**
     * 売上統計
     * @param begin
     * @param end
     * @return
     */
    @GetMapping("/turnoverStatistics")
    @Operation(summary = "Turnover Report")
    public Result<TurnoverReportVO> turnoverStatistics(@DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate begin,
                                                       @DateTimeFormat(pattern = "yyyy-MM-dd")LocalDate end){
        log.info("turnover report :{},{}", begin, end);
        return Result.success(reportService.getTurnoverStatistics(begin,end));

    }

    /**
     * ユーザー統計
     * @param begin
     * @param end
     * @return
     */
    @GetMapping("/userStatistics")
    @Operation(summary = "User Report")
    public Result<UserReportVO> userReport(@DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate begin,
                                           @DateTimeFormat(pattern = "yyyy-MM-dd")LocalDate end){
        log.info("user report :{},{}", begin, end);
        return Result.success(reportService.getUserStatistics(begin,end));
    }

    /**
     * 注文トータルレポート
     * @param begin
     * @param end
     * @return
     */
    @GetMapping("/orderStatistics")
    @Operation(summary = "Orders Report")
    public Result<OrderReportVO> orderReport(@DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate begin,
                                             @DateTimeFormat(pattern = "yyyy-MM-dd")LocalDate end){
        log.info("order report :{},{}", begin, end);
        return Result.success(reportService.getOrderStatistics(begin,end));
    }
}
