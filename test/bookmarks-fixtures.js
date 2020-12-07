function makeBookmarksArray() {
    return [
        {
            id: 1,
            title: 'CNN',
            url: 'https://www.cnn.com',
            description: 'Neo-liberal news source',
            rating: 3
        },
        {
            id: 2,
            title: 'FOX',
            url: 'https://www.fox.com',
            description: 'Right wing news source',
            rating: 1
        },
        {
            id: 3,
            title: 'Market Watch',
            url: 'https://www.marketwatch.com',
            description: 'Financial news',
            rating: 5
        },
    ];
}

function makeMaliciousBookmark() {
    const maliciousBookmark = {
      id: 911,
      title: 'Naughty naughty very naughty <script>alert("xss");</script>',
      url: 'https://www.hackers.com',
      description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
      rating: 1,
    }
    const expectedBookmark = {
      ...maliciousBookmark,
      title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
      description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
    }
    return {
      maliciousBookmark,
      expectedBookmark,
    }
}

module.exports = {
    makeBookmarksArray,
    makeMaliciousBookmark
}