package com.sy.controller.user;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.sy.constant.DeleteConstant;
import com.sy.context.BaseContext;
import com.sy.entity.AddressBook;
import com.sy.result.Result;
import com.sy.service.AddressBookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("user/addressBook")
@Tag(name = "C-Address-API")
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
     * @param addressBook
     * @return
     */
    @PostMapping
    @Operation(summary = "Add address")
    public Result addAddress(@RequestBody AddressBook addressBook) {
        addressBook.setUserId(BaseContext.getCurrentId());
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
