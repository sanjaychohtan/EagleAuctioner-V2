package com.eagleauctioner.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaController {
    
    @RequestMapping(value = {
        "/{path:^(?!swagger-ui|swagger-resources|webjars|v3|actuator|api|error)[^\\.]*}",
        "/{path:^(?!swagger-ui|swagger-resources|webjars|v3|actuator|api|error)[^\\.]*}/**"
    })
    public String redirect() {
        return "forward:/index.html";
    }
}
