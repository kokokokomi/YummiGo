package com.sy.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sy.context.BaseContext;
import com.sy.entity.AddressBook;
import com.sy.service.AddressBookService;
import com.sy.mapper.AddressBookMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
* @author kokomi
* @description 针对表【address_book(住所録)】的数据库操作Service实现
* @createDate 2025-08-06 22:25:11
*/
@Service
public class AddressBookServiceImpl extends ServiceImpl<AddressBookMapper, AddressBook>
    implements AddressBookService{
    @Autowired
    private AddressBookMapper addressBookMapper;

    /**
     * Set default address  デフォルト住所を設定
     * @param addressBook
     */
    @Override
    public void setDefault(AddressBook addressBook) {
        addressBook.setIsDefault(0);
        addressBook.setUserId(BaseContext.getCurrentId());
        addressBookMapper.updateIsDefaultByUserId(addressBook);

        addressBook.setIsDefault(1);
        addressBookMapper.updateById(addressBook);
    }

    /**
     * Update address by ID  / IDで住所を更新
     * @param addressBook
     */
    @Override
    public void updateAddress(AddressBook addressBook) {
        addressBookMapper.updateAddress(addressBook);
    }
}




