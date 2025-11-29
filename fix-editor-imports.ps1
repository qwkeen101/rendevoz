# 批量修复 Editor 内部引用

Write-Host "开始修复 Editor 内部引用..." -ForegroundColor Green

$editorSrcPath = "packages\editor\src"

# 1. 修复内部循环引用 - 将 @/core/components/editor/ 替换为相对路径
Write-Host "`n1. 修复内部循环引用..." -ForegroundColor Yellow
$files1 = Get-ChildItem -Path $editorSrcPath -Recurse -Include *.ts,*.tsx -File
$count1 = 0
foreach ($file in $files1) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # 替换 @/core/components/editor/ 为相对路径（简化处理，统一使用 ../）
    $content = $content -replace "from '@/core/components/editor/", "from '../"
    $content = $content -replace 'from "@/core/components/editor/', 'from "../'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $count1++
    }
}
Write-Host "修复了 $count1 个文件的内部循环引用" -ForegroundColor Cyan

# 2. 修复 @/utils/id 引用
Write-Host "`n2. 修复 @/utils/id 引用..." -ForegroundColor Yellow 
$files2 = Get-ChildItem -Path $editorSrcPath -Recurse -Include *.ts,*.tsx -File
$count2 = 0
foreach ($file in $files2) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # 计算相对路径深度
    $relativePath = $file.FullName.Replace((Get-Location).Path + "\packages\editor\src\", "")
    $depth = ($relativePath -split "\\").Length - 1
    $relativePrefix = if ($depth -gt 0) { "../" * $depth } else { "./" }
    
    $content = $content -replace "from '@/utils/id'", "from '${relativePrefix}utils/id'"
    $content = $content -replace 'from "@/utils/id"', "from '${relativePrefix}utils/id'"
    $content = $content -replace "import Id from '@/utils/id'", "import Id from '${relativePrefix}utils/id'"
    $content = $content -replace 'import Id from "@/utils/id"', "import Id from '${relativePrefix}utils/id'"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $count2++
    }
}
Write-Host "修复了 $count2 个文件的 @/utils/id 引用" -ForegroundColor Cyan

Write-Host "`n✅ 完成！共修复 $($count1 + $count2) 个文件" -ForegroundColor Green
Write-Host "`n下一步：手动处理复杂依赖（@/api/stores, @/consts 等）" -ForegroundColor Yellow
