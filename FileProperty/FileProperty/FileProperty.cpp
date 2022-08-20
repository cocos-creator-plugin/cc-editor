#include <iostream>
#include <windows.h>
using namespace std;
#pragma comment(lib,"version.lib")


char* getFileVersion(std::string& file, std::string& ){
    // get version size
    DWORD versionSize = GetFileVersionInfoSizeA(file.c_str(), NULL);
    if (versionSize == 0)
    {
        return 0;
    }

    // get version data
    BYTE* versionData = new BYTE[versionSize];
    memset(versionData, 0, versionSize);
    DWORD ret = GetFileVersionInfoA(file.c_str(), NULL, versionSize, versionData);
    if (ret == 0)
    {

    }
    // get lang set
    DWORD* transTable = nullptr;
    UINT len = 0;
    ret = VerQueryValue(versionData, TEXT("\\VarFileInfo\\Translation"), (LPVOID*)&transTable, &len);
    if (!ret)
    {
        return 0;
    }
    DWORD lang = MAKELONG(HIWORD(transTable[0]), LOWORD(transTable[0]));
    CHAR tmp[128] = { 0 };
    memset(tmp, 0, sizeof(CHAR) * 128);
    sprintf_s(tmp, 128, "\\StringFileInfo\\%08lx\\%s", lang, "FileDescription");

    char* result = NULL;
    VerQueryValueA(versionData, tmp, (LPVOID*)&result, &len);
    return result;
}

int main()

{
    wchar_t file[] = L"E:/CocosDashboard_1.1.2/resources/.editors/Creator/2.4.8/CocosCreator.exe";
   
    return 0;
}

