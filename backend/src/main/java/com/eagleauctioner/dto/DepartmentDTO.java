package com.eagleauctioner.dto;

import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentDTO {
    private UUID id;
    private String code;
    private String name;
    private String description;
    private UUID parentId;
    private List<DepartmentDTO> subDepartments;
}
