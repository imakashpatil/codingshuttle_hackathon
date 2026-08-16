package com.notifyhub.core.service.user;

import com.notifyhub.core.dto.user.request.UserRequest;
import com.notifyhub.core.dto.user.response.UserResponse;
import com.notifyhub.core.entity.user.User;
import com.notifyhub.shared.exception.ResourceNotFoundException;
import com.notifyhub.core.mapper.user.UserMapper;
import com.notifyhub.core.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public UserResponse create(UserRequest request) {
        User user = userMapper.toEntity(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setActive(true);
        return userMapper.toResponse(userRepository.save(user));
    }

    public UserResponse update(UUID id, UserRequest request) {
        User user = getEntity(id);
        userMapper.updateEntity(request, user);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        return userMapper.toResponse(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public UserResponse getById(UUID id) {
        return userMapper.toResponse(getEntity(id));
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAll() {
        return userRepository.findAll()
                .stream()
                .filter(User::isActive)
                .map(userMapper::toResponse)
                .toList();
    }

    public void delete(UUID id) {
        User user = getEntity(id);
        user.setActive(false);
        userRepository.save(user);
    }

    private User getEntity(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }
}

