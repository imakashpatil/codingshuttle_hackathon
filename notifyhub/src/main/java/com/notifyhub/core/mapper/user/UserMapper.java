package com.notifyhub.core.mapper.user;


import com.notifyhub.core.dto.user.request.UserRequest;
import com.notifyhub.core.dto.user.response.UserResponse;
import com.notifyhub.core.entity.user.User;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UserMapper {

    User toEntity(UserRequest request);

    UserResponse toResponse(User entity);

    void updateEntity(UserRequest request, @MappingTarget User entity);
}

