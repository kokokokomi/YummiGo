package com.sy.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.sy.entity.AddressBook;
import com.sy.service.AddressBookService;
import com.sy.mapper.AddressBookMapper;
import org.springframework.stereotype.Service;

/**
* @author kokomi
* @description 针对表【address_book(住所録)】的数据库操作Service实现
* @createDate 2025-08-06 22:25:11
*/
@Service
public class AddressBookServiceImpl extends ServiceImpl<AddressBookMapper, AddressBook>
    implements AddressBookService{

}




