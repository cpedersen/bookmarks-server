INSERT INTO bookmarks_test (id, title, url, description, rating)
VALUES
    (1, 'CNN', 'https://www.cnn.com', '3', 'Liberal news media'),
    (2, 'FOX', 'https://www.fox.com', '1', 'Conservative news media'),
    (3, 'Market Watch', 'https://marketwatch.com', '5', 'Financial news');
ALTER SEQUENCE bookmarks_test_id_seq RESTART WITH 4
