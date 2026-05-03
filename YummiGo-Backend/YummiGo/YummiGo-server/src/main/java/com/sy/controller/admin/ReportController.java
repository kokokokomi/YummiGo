package com.sy.controller.admin;

import com.sy.result.Result;
import com.sy.service.ReportService;
import com.sy.vo.TurnoverReportVO;
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
}
