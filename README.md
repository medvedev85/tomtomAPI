# tomtomAPI
Программа предназначена для интеграции с MEME Suite Software (версия 5.1.1) и предоставления простого API на базе meme.
## Дополнительные пакеты
Можно сразу перейти к следующему разделу, но если после выполнения `./configure` получили ошибку, потребуется установить некоторые дополнительные пакеты: 
1) Perl
    `$ sudo apt-get install perl -y`
После установки Perl, выполнить команды:
    `$ cd scripts`
    `$ perl dependencies.pl`
2) Python (используется версия 2.7 и 3.x)
    `$ sudo apt-get install python2.7`
    `$ sudo apt-get install python3.7`
3) zlib
    `$ sudo apt-get install zlib1g-dev`
4) Ghostscript
    `$ sudo apt-get install ghostscript`
5) gcc
    `$ sudo apt install gcc`
Теперь можно продолжить установку.
## Установка (Linux)
Для начала необходимо скачать и установить meme [meme-suite.org](http://meme-suite.org/doc/download.html)
Выполнить команды:
    `$ tar zxf meme-5.1.1.tar.gz`
    `$ cd meme-5.1.1`
    `$ ./configure --prefix=$HOME/meme --with-url=http://meme-suite.org/ --enable-build-libxml2 --enable-build-libxslt`
    `$ make`
    `$ make test`
    `$ make install`
Отредактируйте файл конфигурации оболочки, чтобы добавить $HOME/meme/bin:
    `$ export PATH=$HOME/meme/bin:$HOME/meme/libexec/meme-5.1.1:$PATH`
## Дополнительно
Также нам потребуется [база Jaspar](http://jaspar2020.genereg.net/download/CORE/JASPAR2020_CORE_non-redundant_pfms_meme.txt). Для нее нужно создать директорию `db` в `meme-5.1.1` и в этой директории создать еще директорию `JASPAR` - туда поместить файл с базой. 