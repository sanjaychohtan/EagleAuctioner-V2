package com.eagleauctioner.aspect;

import com.eagleauctioner.enums.DataScopeType;

import java.lang.annotation.*;

@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface EnforceDataScope {
    DataScopeType value() default DataScopeType.COMPANY;
}
