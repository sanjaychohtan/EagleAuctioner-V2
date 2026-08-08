package com.eagleauctioner.security;

import com.eagleauctioner.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.UUID;

@Getter
public class UserPrincipal implements UserDetails {
    private final UUID id;
    private final String email;
    private final String password;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserPrincipal(UUID id, String email, String password, Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.authorities = authorities;
    }

    public static UserPrincipal create(User user) {
        java.util.Set<GrantedAuthority> authorities = new java.util.HashSet<>();
        if (user.getRoles() != null) {
            for (com.eagleauctioner.entity.Role role : user.getRoles()) {
                authorities.add(new SimpleGrantedAuthority(role.getName().startsWith("ROLE_") ? role.getName() : "ROLE_" + role.getName()));
                authorities.add(new SimpleGrantedAuthority(role.getName()));
                if (role.getPermissions() != null) {
                    for (com.eagleauctioner.entity.Permission p : role.getPermissions()) {
                        if (p.getName() != null && !p.getName().isBlank()) {
                            authorities.add(new SimpleGrantedAuthority(p.getName()));
                        }
                        if (p.getActionKey() != null && !p.getActionKey().isBlank()) {
                            authorities.add(new SimpleGrantedAuthority(p.getActionKey()));
                        }
                    }
                }
            }
        }

        return new UserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getPassword(),
                authorities
        );
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
