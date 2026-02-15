$path = "c:\Users\kaano\OneDrive\Desktop\10\services\MatchEngine.ts"
$content = Get-Content $path -Raw -Encoding UTF8

# Define replacements
$replacements = @{
    "ÅŸ" = "ş";
    "Ä±" = "ı";
    "Ã§" = "ç";
    "Ã¶" = "ö";
    "Ã¼" = "ü";
    "ÄŸ" = "ğ";
    "Åž" = "Ş";
    "Ä°" = "İ";
    "Ã‡" = "Ç";
    "Ã–" = "Ö";
    "Ãœ" = "Ü";
    "Äž" = "Ğ";
    "â†’" = "->";
    "Â" = ""; # Common artifact with non-breaking space or before copyright
}

foreach ($key in $replacements.Keys) {
    if ($content -match [regex]::Escape($key)) {
        Write-Host "Fixing $key -> $($replacements[$key])"
        $content = $content.Replace($key, $replacements[$key])
    }
}

Set-Content -Path $path -Value $content -Encoding UTF8
Write-Host "Encoding fix complete."
