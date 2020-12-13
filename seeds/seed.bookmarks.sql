INSERT INTO bookmarks (id, title, url, description, rating)
VALUES
    (1, 'CNN', 'https://www.cnn.com', 'Liberal news media', '3'),
    (2, 'FOX', 'https://www.fox.com', 'Conservative news media', '1'),
    (3, 'Market Watch', 'https://marketwatch.com', 'Financial news', '5');
ALTER SEQUENCE bookmarks_id_seq RESTART WITH 4