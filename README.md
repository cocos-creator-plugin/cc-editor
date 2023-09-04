# cce
通过cli启动调试Creator主进程，也可以进行简单的Creator的版本和项目管理工作。

详细的使用方法可以通过以下命令查看
```shell
npm i @xuyanfeng/cc-editor -g
cce -h
```

# 使用前的准备

1. 添加项目、编辑器配置信息
```shell
cce add-project 项目路径
cce add-editor 编辑器别名 编辑器路径
```

2. 选择项目、编辑器的配置，以下2个命令是交互式的，不需要手动输入
```shell
cce use-project
cce use-editor
```
3. 查看当前的配置信息
```shell
cce list
cce cfg
```
4. 启动运行项目
```shell
cce run
``` 
# 快速切换配置项
可以将指定的编辑器和项目绑定为一个组合，在不同的组合配置之间快速切换

以下交互式命令，会从已有的配置中进行选择
```shell
cce add-group name
```

以下交互式命令，选择并使用已经设置过的组合
```shell
cce use-group
```
此时，通过以下命令发现配置已经完成了切换
```shell
cce list
```
# 使用场景

## 1.日常开发启动项目
当项目开始正式开发后，每天打开的Creator版本和项目其实是固定的，每次都要启动编辑器比较麻烦，通过cli的一些简单配置，就可以通过命令行一键启动。
 
## 2.调试插件主进程
当开发Creator插件时，需要调试主进程，每次都需要添加那些记不住而又不得不输入的调试参数，通过这个cli，可以免去这些烦恼。

- 设置为true后，项目就会开启主进程调试功能
    ```shell
    cce set-debug true
    ```


- 设置主进程调试的端口
    ```shell
    cce set-port 2021
    ```
 
- 设置是否在主进程的第一行代码设置断点
    ```shell
    cce set-brk true
    ```


## 3.配合cc-plugin，提高插件开发效率

插件开发过程中需要在不同的creator版本进行自测，通过cc-editor快速切换配置项，提高插件开发效率。

`更多功能，不定期更新...`
