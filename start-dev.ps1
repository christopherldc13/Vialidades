$root = Get-Location
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\server'; npm start"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\client'; npm run dev"
