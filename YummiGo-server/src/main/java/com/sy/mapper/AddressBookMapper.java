package com.sy.mapper;

import com.sy.entity.AddressBook;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;

/**
* @author kokomi
* @description 针对表【address_book(住所録)】的数据库操作Mapper
* @createDate 2025-08-06 22:25:11
* @Entity com.sy.entity.AddressBook
*/
public interface AddressBookMapper extends BaseMapper<AddressBook> {

    //Set default address based on user ID ユーザーIDに基づいてデフォルト住所を設定
    void updateIsDefaultByUserId(AddressBook addressBook);

    //Update address by ID  / IDで住所を更新
    void updateAddress(AddressBook addressBook);
}




