IF DB_ID(N'PaperPlane') IS NULL
BEGIN
    CREATE DATABASE [PaperPlane];
END;
GO

SELECT name AS DatabaseName
FROM sys.databases
WHERE name = N'PaperPlane';
GO
