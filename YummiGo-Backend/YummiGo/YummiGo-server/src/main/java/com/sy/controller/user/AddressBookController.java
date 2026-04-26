package com.sy.controller.user;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sy.constant.DeleteConstant;
import com.sy.context.BaseContext;
import com.sy.dto.AddressDTO;
import com.sy.entity.AddressBook;
import com.sy.result.Result;
import com.sy.service.AddressBookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("user/address")
@Tag(name = "C-Address-API")
@Slf4j
public class AddressBookController {
    @Autowired
    private AddressBookService addressBookService;

    /**
     * Get all address information for the currently logged-in user
     * 現在ログイン中のユーザーの全住所情報を取得
     * @return
     */
    @GetMapping("list")
    @Operation(summary = "Query all address")
    public Result<List<AddressBook>> list() {
        List<AddressBook> list = addressBookService.list(
                new LambdaQueryWrapper<AddressBook>()
                        .eq(AddressBook::getUserId, BaseContext.getCurrentId())
                        .eq(AddressBook::getIsDeleted, DeleteConstant.NOT_DELETED)
        );
        return Result.success(list);
    }

    /**
     * Add new address  新しい住所を追加
     * @param
     * @return
     */
    @PostMapping
    @Operation(summary = "Add address")
    public Result addAddress(@RequestBody AddressDTO dto) {
        log.info("tianjia "+dto.toString());
        AddressBook addressBook = new AddressBook();
        BeanUtils.copyProperties(dto, addressBook);
        addressBook.setUserId(BaseContext.getCurrentId());
        String fullAddress = String.join("",
                dto.getProvinceName(),
                dto.getCityName(),
                dto.getDistrictName(),
                dto.getDetail()
        );
        addressBook.setFullAddress(fullAddress);
        addressBookService.save(addressBook);
        return Result.success();
    }

    /**
     * Get address by ID /IDで住所を検索
     * @param id
     * @return
     */
    @GetMapping("/{id}")
    @Operation(summary = "Query address")
    public Result<AddressBook> getAddressBookById(@PathVariable Long id) {
        AddressBook addressBook = addressBookService.getById(id);
        return Result.success(addressBook);
    }

    /**
     * Update address by ID  / IDで住所を更新
     * @param addressBook
     * @return
     */
    @PutMapping
    @Operation(summary = "Update address")
    public Result updateAddress(@RequestBody AddressBook addressBook) {
        log.info("updateAddress: "+addressBook.toString());
        String fullAddress = String.join("",
                addressBook.getProvinceName(),
                addressBook.getCityName(),
                addressBook.getDistrictName(),
                addressBook.getDetail()
        );
        //TODO:还是不理解为什么不会直接填充，不传入update_time也会被带进来旧值
        addressBook.setUpdateTime(null);
        addressBook.setFullAddress(fullAddress);
        addressBookService.updateAddress(addressBook);
        return Result.success();
    }

    /**
     * Set default address  デフォルト住所を設定
     * @param addressBook
     * @return
     */
    @PutMapping("default")
    @Operation(summary = "Set default address")
    public Result setDefault(@RequestBody AddressBook addressBook){
        addressBookService.setDefault(addressBook);
        return Result.success();
    }

    /**
     * Delete address by ID IDで住所を削除
     * @param id
     * @return
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete address")
    public Result deleteAddressBookById(@PathVariable Long id) {
        addressBookService.removeById(id);
        return Result.success();
    }

    @GetMapping("default")
    @Operation(summary = "Get default address")
    public Result<AddressBook> getDefaultAddress() {
        List<AddressBook> list = addressBookService.list(
                new LambdaQueryWrapper<AddressBook>()
                        .eq(AddressBook::getIsDeleted, DeleteConstant.NOT_DELETED)
                        .eq(AddressBook::getUserId, BaseContext.getCurrentId())
                        .eq(AddressBook::getIsDefault, 1)
        );
        if(list !=null && list.size() ==1){
            return Result.success(list.get(0));
        }
        return Result.error("Default address not found");
    }
}
