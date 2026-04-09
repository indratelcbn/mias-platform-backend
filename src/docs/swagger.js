/**
 * OpenAPI 3.0 specification for MIAS 2026 Backend API
 * Masjid Imam Asy Syafi'i Depok
 */

const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: "MIAS API - Masjid Imam Asy Syafi'i Depok",
    version: '1.0.0',
    description:
      "Dokumentasi lengkap REST API untuk website Masjid Imam Asy Syafi'i Depok (MIAS). " +
      'Endpoint yang memerlukan autentikasi menggunakan **Bearer JWT Token** — login terlebih dahulu ' +
      'di `/api/auth/login` lalu masukkan token di tombol **Authorize**.',
    contact: {
      name: 'MIAS Dev Team',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      // ── Generic ──────────────────────────────────────────────────────────────
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Berhasil' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Terjadi kesalahan.' },
        },
      },
      // ── Auth ─────────────────────────────────────────────────────────────────
      LoginRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', example: 'admin' },
          password: { type: 'string', format: 'password', example: 'password123' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          token: { type: 'string', description: 'JWT Bearer Token' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              username: { type: 'string' },
              role: { type: 'string', example: 'ADMIN' },
            },
          },
        },
      },
      // ── Kajian ───────────────────────────────────────────────────────────────
      Kajian: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          judul: { type: 'string', example: 'Kajian Tafsir Al-Quran' },
          ustadz: { type: 'string', example: 'Ustadz Ahmad' },
          tanggal: { type: 'string', format: 'date', example: '2026-04-15' },
          waktu: { type: 'string', example: '19:30' },
          lokasi: { type: 'string', example: 'Masjid MIAS' },
          thumbnail: { type: 'string', example: '/uploads/thumbnails/kajian-xxxxx.webp' },
          deskripsi: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      // ── Artikel ──────────────────────────────────────────────────────────────
      Artikel: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          judul: { type: 'string', example: 'Keutamaan Shalat Berjamaah' },
          slug: { type: 'string', example: 'keutamaan-shalat-berjamaah' },
          konten: { type: 'string' },
          thumbnail: { type: 'string', example: '/uploads/thumbnails/artikel-xxxxx.webp' },
          published: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      // ── Donasi ───────────────────────────────────────────────────────────────
      Donasi: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          nama: { type: 'string', example: 'Budi Santoso' },
          jumlah: { type: 'number', example: 100000 },
          pesan: { type: 'string' },
          programId: { type: 'string', format: 'uuid', nullable: true },
          buktiTransfer: { type: 'string' },
          status: { type: 'string', enum: ['PENDING', 'VERIFIED', 'REJECTED'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Rekening: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          namaBank: { type: 'string', example: 'Bank Mandiri' },
          noRekening: { type: 'string', example: '1234567890' },
          atasNama: { type: 'string', example: "Masjid Imam Asy Syafi'i" },
          isActive: { type: 'boolean' },
          qrisImage: { type: 'string', nullable: true },
        },
      },
      ProgramDonasi: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          judul: { type: 'string', example: 'Pembangunan Menara Masjid' },
          target: { type: 'number', example: 500000000 },
          terkumpul: { type: 'number', example: 120000000 },
          isActive: { type: 'boolean' },
          deskripsi: { type: 'string' },
        },
      },
      // ── Galeri ───────────────────────────────────────────────────────────────
      Galeri: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          judul: { type: 'string', example: 'Buka Puasa Bersama' },
          foto: { type: 'string', example: '/uploads/galeri/foto-xxxxx.webp' },
          kategori: { type: 'string', enum: ['RAMADHAN', 'SHOLAT_IED'] },
          keterangan: { type: 'string', nullable: true },
          tahun: { type: 'integer', example: 2026 },
          urutan: { type: 'integer', example: 1 },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      // ── Streaming ────────────────────────────────────────────────────────────
      Streaming: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          judul: { type: 'string', example: 'Live Kajian Jumat' },
          url: { type: 'string', example: 'https://youtube.com/watch?v=...' },
          isLive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      // ── Sosial ───────────────────────────────────────────────────────────────
      SosialFoto: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          judul: { type: 'string' },
          foto: { type: 'string' },
          kategori: {
            type: 'string',
            enum: [
              'SANTUNAN_ANAK_YATIM',
              'AIR_GALON_GRATIS',
              'LAYANAN_KESEHATAN_IBU_ANAK',
              'ARMALAH_AL_MISKIN',
              'BANTUAN_PENGOBATAN',
              'ZAKAT_MAAL',
            ],
          },
          tahun: { type: 'integer', example: 2026 },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      // ── Pendidikan ───────────────────────────────────────────────────────────
      PendidikanFoto: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          judul: { type: 'string' },
          foto: { type: 'string' },
          kategori: {
            type: 'string',
            enum: ['TAHSIN_IKHWAN', 'TAHSIN_AKHWAT', 'BAHASA_ARAB_IKHWAN', 'BAHASA_ARAB_AKHWAT', 'TPQ'],
          },
          tahun: { type: 'integer', example: 2026 },
        },
      },
      PendidikanInfo: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          kategori: { type: 'string' },
          pengajar: { type: 'string' },
          jumlahPenuntutIlmu: { type: 'integer' },
          kitab: { type: 'string' },
          jadwal: { type: 'string' },
        },
      },
      // ── Usaha ────────────────────────────────────────────────────────────────
      Umroh: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          judul: { type: 'string', example: 'Paket Umroh Ramadhan 2026' },
          flyer: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      MiasMart: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          nama: { type: 'string', example: 'Kurma Ajwa 1kg' },
          harga: { type: 'number', example: 150000 },
          foto: { type: 'string' },
          deskripsi: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      // ── Qurban ───────────────────────────────────────────────────────────────
      Qurban: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          judul: { type: 'string', example: 'Penyembelihan Qurban 2026' },
          foto: { type: 'string' },
          tahun: { type: 'integer', example: 2026 },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      // ── Profil ───────────────────────────────────────────────────────────────
      Sejarah: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          konten: { type: 'string' },
          foto: { type: 'string', nullable: true },
        },
      },
      VisiMisi: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          visi: { type: 'string' },
          misi: { type: 'string' },
        },
      },
      Fasilitas: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          nama: { type: 'string', example: 'Ruang Tahfidz' },
          deskripsi: { type: 'string' },
          fotos: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, url: { type: 'string' } } } },
        },
      },
      Pemateri: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          nama: { type: 'string', example: 'Ustadz Abdurrahman' },
          foto: { type: 'string', nullable: true },
          bidang: { type: 'string' },
          bio: { type: 'string' },
        },
      },
      // ── Setting ──────────────────────────────────────────────────────────────
      Setting: {
        type: 'object',
        properties: {
          facebook: { type: 'string', nullable: true },
          instagram: { type: 'string', nullable: true },
          youtube: { type: 'string', nullable: true },
          whatsapp: { type: 'string', nullable: true },
          alamat: { type: 'string', nullable: true },
        },
      },
      // ── Pesan ────────────────────────────────────────────────────────────────
      Pesan: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          nama: { type: 'string' },
          email: { type: 'string', format: 'email' },
          noHp: { type: 'string' },
          kategori: {
            type: 'string',
            enum: [
              'FASILITAS',
              'DIVISI_DAKWAH',
              'DIVISI_PENDIDIKAN',
              'DIVISI_SOSIAL',
              'UMROH',
              'PEMBELIAN_PRODUK_MIAS_MART',
              'LAIN_LAIN',
            ],
          },
          pesan: { type: 'string' },
          status: { type: 'string', enum: ['BELUM_DITINDAKLANJUTI', 'SUDAH_DITINDAKLANJUTI'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  // ══════════════════════════════════════════════════════════════════════════════
  //  PATHS
  // ══════════════════════════════════════════════════════════════════════════════
  paths: {
    // ── Health ───────────────────────────────────────────────────────────────
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        responses: {
          200: {
            description: 'API is running',
            content: {
              'application/json': {
                example: { status: 'OK', message: "Masjid Imam Asy Syafi'i Depok API" },
              },
            },
          },
        },
      },
    },

    // ── AUTH ─────────────────────────────────────────────────────────────────
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login admin',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } },
          },
        },
        responses: {
          200: { description: 'Login berhasil', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } },
          401: { description: 'Username atau password salah', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/auth/profile': {
      get: {
        tags: ['Auth'],
        summary: 'Profil user yang sedang login',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Profil pengguna' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/auth/change-password': {
      put: {
        tags: ['Auth'],
        summary: 'Ganti password',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['oldPassword', 'newPassword'],
                properties: {
                  oldPassword: { type: 'string' },
                  newPassword: { type: 'string', minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password berhasil diubah' },
          400: { description: 'Password lama salah atau validasi gagal' },
          401: { description: 'Unauthorized' },
        },
      },
    },

    // ── KAJIAN ───────────────────────────────────────────────────────────────
    '/api/kajian': {
      get: {
        tags: ['Kajian'],
        summary: 'Daftar kajian mendatang (public)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          200: { description: 'Daftar kajian', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Kajian' } } } } } } },
        },
      },
    },
    '/api/kajian/admin/all': {
      get: {
        tags: ['Kajian'],
        summary: 'Semua kajian (admin)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Semua kajian' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/kajian/{id}': {
      get: {
        tags: ['Kajian'],
        summary: 'Detail kajian (public)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Detail kajian', content: { 'application/json': { schema: { $ref: '#/components/schemas/Kajian' } } } },
          404: { description: 'Kajian tidak ditemukan' },
        },
      },
      put: {
        tags: ['Kajian'],
        summary: 'Update kajian (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  judul: { type: 'string' },
                  ustadz: { type: 'string' },
                  tanggal: { type: 'string', format: 'date' },
                  waktu: { type: 'string' },
                  lokasi: { type: 'string' },
                  deskripsi: { type: 'string' },
                  thumbnail: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Kajian diperbarui' },
          401: { description: 'Unauthorized' },
          404: { description: 'Kajian tidak ditemukan' },
        },
      },
      delete: {
        tags: ['Kajian'],
        summary: 'Hapus kajian (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Kajian dihapus' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/kajian/': {
      post: {
        tags: ['Kajian'],
        summary: 'Tambah kajian baru (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['judul', 'ustadz', 'tanggal', 'waktu'],
                properties: {
                  judul: { type: 'string' },
                  ustadz: { type: 'string' },
                  tanggal: { type: 'string', format: 'date' },
                  waktu: { type: 'string' },
                  lokasi: { type: 'string' },
                  deskripsi: { type: 'string' },
                  thumbnail: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Kajian ditambahkan' },
          400: { description: 'Validasi gagal' },
          401: { description: 'Unauthorized' },
        },
      },
    },

    // ── ARTIKEL ──────────────────────────────────────────────────────────────
    '/api/artikel': {
      get: {
        tags: ['Artikel'],
        summary: 'Daftar artikel yang dipublikasikan (public)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: { 200: { description: 'Daftar artikel', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Artikel' } } } } } } } },
      },
    },
    '/api/artikel/admin/all': {
      get: {
        tags: ['Artikel'],
        summary: 'Semua artikel termasuk draft (admin)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Semua artikel' } },
      },
    },
    '/api/artikel/slug/{slug}': {
      get: {
        tags: ['Artikel'],
        summary: 'Detail artikel by slug (public)',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string', example: 'keutamaan-shalat-berjamaah' } }],
        responses: {
          200: { description: 'Detail artikel' },
          404: { description: 'Artikel tidak ditemukan' },
        },
      },
    },
    '/api/artikel/{id}': {
      get: {
        tags: ['Artikel'],
        summary: 'Detail artikel by ID (public)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Detail artikel' } },
      },
      put: {
        tags: ['Artikel'],
        summary: 'Update artikel (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  judul: { type: 'string' },
                  konten: { type: 'string' },
                  published: { type: 'boolean' },
                  thumbnail: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Artikel diperbarui' } },
      },
      delete: {
        tags: ['Artikel'],
        summary: 'Hapus artikel (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Artikel dihapus' } },
      },
    },
    '/api/artikel/': {
      post: {
        tags: ['Artikel'],
        summary: 'Tambah artikel baru (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['judul', 'konten'],
                properties: {
                  judul: { type: 'string' },
                  konten: { type: 'string' },
                  published: { type: 'boolean' },
                  thumbnail: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Artikel ditambahkan' } },
      },
    },

    // ── DONASI ───────────────────────────────────────────────────────────────
    '/api/donasi/rekening': {
      get: {
        tags: ['Donasi'],
        summary: 'Daftar rekening donasi (public)',
        responses: { 200: { description: 'Daftar rekening', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Rekening' } } } } } },
      },
      post: {
        tags: ['Donasi'],
        summary: 'Tambah rekening (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['namaBank', 'noRekening', 'atasNama'],
                properties: {
                  namaBank: { type: 'string' },
                  noRekening: { type: 'string' },
                  atasNama: { type: 'string' },
                  qrisImage: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Rekening ditambahkan' } },
      },
    },
    '/api/donasi/rekening/{id}': {
      put: {
        tags: ['Donasi'],
        summary: 'Update rekening (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  namaBank: { type: 'string' },
                  noRekening: { type: 'string' },
                  atasNama: { type: 'string' },
                  qrisImage: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Rekening diperbarui' } },
      },
      delete: {
        tags: ['Donasi'],
        summary: 'Hapus rekening (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Rekening dihapus' } },
      },
    },
    '/api/donasi/program': {
      get: {
        tags: ['Donasi'],
        summary: 'Program donasi aktif (public)',
        responses: { 200: { description: 'Program aktif', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/ProgramDonasi' } } } } } },
      },
    },
    '/api/donasi/program/all': {
      get: {
        tags: ['Donasi'],
        summary: 'Semua program donasi (admin)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Semua program donasi' } },
      },
      post: {
        tags: ['Donasi'],
        summary: 'Tambah program donasi (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['judul', 'target'],
                properties: {
                  judul: { type: 'string' },
                  target: { type: 'number' },
                  deskripsi: { type: 'string' },
                  isActive: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Program ditambahkan' } },
      },
    },
    '/api/donasi/program/{id}': {
      put: {
        tags: ['Donasi'],
        summary: 'Update program donasi (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/ProgramDonasi' } } } },
        responses: { 200: { description: 'Program diperbarui' } },
      },
      delete: {
        tags: ['Donasi'],
        summary: 'Hapus program donasi (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Program dihapus' } },
      },
    },
    '/api/donasi': {
      get: {
        tags: ['Donasi'],
        summary: 'Daftar semua donasi masuk (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'VERIFIED', 'REJECTED'] } },
        ],
        responses: { 200: { description: 'Daftar donasi' } },
      },
      post: {
        tags: ['Donasi'],
        summary: 'Kirim donasi baru (public)',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['nama', 'jumlah'],
                properties: {
                  nama: { type: 'string', example: 'Budi Santoso' },
                  jumlah: { type: 'number', example: 100000, description: 'Minimal Rp 1.000' },
                  pesan: { type: 'string' },
                  programId: { type: 'string', format: 'uuid' },
                  buktiTransfer: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Donasi dikirim, menunggu verifikasi' },
          400: { description: 'Validasi gagal' },
        },
      },
    },
    '/api/donasi/summary': {
      get: {
        tags: ['Donasi'],
        summary: 'Ringkasan statistik donasi (admin)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Ringkasan donasi' } },
      },
    },
    '/api/donasi/{id}/status': {
      put: {
        tags: ['Donasi'],
        summary: 'Update status donasi (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: { status: { type: 'string', enum: ['PENDING', 'VERIFIED', 'REJECTED'] } },
              },
            },
          },
        },
        responses: { 200: { description: 'Status donasi diperbarui' } },
      },
    },

    // ── GALERI ───────────────────────────────────────────────────────────────
    '/api/galeri': {
      get: {
        tags: ['Galeri'],
        summary: 'Daftar foto galeri (public)',
        parameters: [
          { name: 'kategori', in: 'query', description: 'Filter by kategori', schema: { type: 'string', enum: ['RAMADHAN', 'SHOLAT_IED'] } },
          { name: 'tahun', in: 'query', description: 'Filter by tahun', schema: { type: 'integer', example: 2026 } },
        ],
        responses: { 200: { description: 'Daftar foto', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Galeri' } } } } } },
      },
      post: {
        tags: ['Galeri'],
        summary: 'Upload foto galeri — bisa sekaligus banyak (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['kategori', 'tahun'],
                properties: {
                  judul: { type: 'string', description: 'Opsional jika batch — judul dasar' },
                  kategori: { type: 'string', enum: ['RAMADHAN', 'SHOLAT_IED'] },
                  tahun: { type: 'integer', example: 2026 },
                  urutan: { type: 'integer', example: 1 },
                  keterangan: { type: 'string' },
                  'foto': { type: 'array', items: { type: 'string', format: 'binary' }, description: 'Bisa upload 1 hingga 20 foto sekaligus' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Foto berhasil diunggah (array jika batch)' },
          400: { description: 'Validasi gagal' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/galeri/admin/all': {
      get: {
        tags: ['Galeri'],
        summary: 'Semua foto galeri (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'kategori', in: 'query', schema: { type: 'string', enum: ['RAMADHAN', 'SHOLAT_IED'] } },
        ],
        responses: { 200: { description: 'Semua foto galeri' } },
      },
    },
    '/api/galeri/{id}': {
      get: {
        tags: ['Galeri'],
        summary: 'Detail foto galeri (public)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Detail foto' } },
      },
      put: {
        tags: ['Galeri'],
        summary: 'Update foto galeri (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  judul: { type: 'string' },
                  keterangan: { type: 'string' },
                  tahun: { type: 'integer' },
                  urutan: { type: 'integer' },
                  foto: { type: 'string', format: 'binary', description: 'Opsional - ganti foto' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Foto diperbarui' } },
      },
      delete: {
        tags: ['Galeri'],
        summary: 'Hapus foto galeri (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Foto dihapus' } },
      },
    },

    // ── STREAMING ────────────────────────────────────────────────────────────
    '/api/streaming/active': {
      get: {
        tags: ['Streaming'],
        summary: 'Streaming yang sedang live (public)',
        responses: { 200: { description: 'Data streaming aktif atau null' } },
      },
    },
    '/api/streaming': {
      get: {
        tags: ['Streaming'],
        summary: 'Semua data streaming (admin)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Daftar streaming' } },
      },
      post: {
        tags: ['Streaming'],
        summary: 'Tambah data streaming (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['judul', 'url'],
                properties: {
                  judul: { type: 'string' },
                  url: { type: 'string', format: 'uri' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Streaming ditambahkan' } },
      },
    },
    '/api/streaming/{id}': {
      get: {
        tags: ['Streaming'],
        summary: 'Detail streaming (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Detail streaming' } },
      },
      put: {
        tags: ['Streaming'],
        summary: 'Update streaming (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Streaming' } },
          },
        },
        responses: { 200: { description: 'Streaming diperbarui' } },
      },
      delete: {
        tags: ['Streaming'],
        summary: 'Hapus streaming (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Streaming dihapus' } },
      },
    },
    '/api/streaming/{id}/set-live': {
      patch: {
        tags: ['Streaming'],
        summary: 'Set streaming sebagai live aktif (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Streaming diset sebagai live' } },
      },
    },

    // ── SOSIAL ───────────────────────────────────────────────────────────────
    '/api/sosial/admin/all': {
      get: {
        tags: ['Program Sosial'],
        summary: 'Semua foto program sosial (admin)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Semua foto' } },
      },
    },
    '/api/sosial/{kategori}': {
      get: {
        tags: ['Program Sosial'],
        summary: 'Foto program sosial by kategori (public)',
        parameters: [
          {
            name: 'kategori', in: 'path', required: true,
            schema: {
              type: 'string',
              enum: ['SANTUNAN_ANAK_YATIM', 'AIR_GALON_GRATIS', 'LAYANAN_KESEHATAN_IBU_ANAK', 'ARMALAH_AL_MISKIN', 'BANTUAN_PENGOBATAN', 'ZAKAT_MAAL'],
            },
          },
        ],
        responses: { 200: { description: 'Foto program sosial', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/SosialFoto' } } } } } },
      },
    },
    '/api/sosial': {
      post: {
        tags: ['Program Sosial'],
        summary: 'Upload foto sosial — bisa sekaligus banyak (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['kategori'],
                properties: {
                  judul: { type: 'string', description: 'Opsional jika batch' },
                  kategori: { type: 'string', enum: ['SANTUNAN_ANAK_YATIM', 'AIR_GALON_GRATIS', 'LAYANAN_KESEHATAN_IBU_ANAK', 'ARMALAH_AL_MISKIN', 'BANTUAN_PENGOBATAN', 'ZAKAT_MAAL'] },
                  foto: { type: 'array', items: { type: 'string', format: 'binary' } },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Foto berhasil diunggah' } },
      },
    },
    '/api/sosial/{id}': {
      put: {
        tags: ['Program Sosial'],
        summary: 'Update foto sosial (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  judul: { type: 'string' },
                  foto: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Foto diperbarui' } },
      },
      delete: {
        tags: ['Program Sosial'],
        summary: 'Hapus foto sosial (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Foto dihapus' } },
      },
    },

    // ── PENDIDIKAN ────────────────────────────────────────────────────────────
    '/api/pendidikan/admin/all-info': {
      get: {
        tags: ['Pendidikan'],
        summary: 'Semua info program pendidikan (admin)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Semua info pendidikan' } },
      },
    },
    '/api/pendidikan/admin/fotos': {
      get: {
        tags: ['Pendidikan'],
        summary: 'Semua foto pendidikan (admin)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Semua foto' } },
      },
    },
    '/api/pendidikan/admin/info/{kategori}': {
      put: {
        tags: ['Pendidikan'],
        summary: 'Upsert info program pendidikan (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'kategori', in: 'path', required: true, schema: { type: 'string', enum: ['TAHSIN_IKHWAN', 'TAHSIN_AKHWAT', 'BAHASA_ARAB_IKHWAN', 'BAHASA_ARAB_AKHWAT', 'TPQ'] } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['pengajar', 'kitab'],
                properties: {
                  pengajar: { type: 'string' },
                  jumlahPenuntutIlmu: { type: 'integer' },
                  kitab: { type: 'string' },
                  jadwal: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Info pendidikan di-upsert' } },
      },
    },
    '/api/pendidikan/foto': {
      post: {
        tags: ['Pendidikan'],
        summary: 'Upload foto pendidikan — bisa sekaligus banyak (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['kategori'],
                properties: {
                  judul: { type: 'string', description: 'Opsional jika batch' },
                  kategori: { type: 'string', enum: ['TAHSIN_IKHWAN', 'TAHSIN_AKHWAT', 'BAHASA_ARAB_IKHWAN', 'BAHASA_ARAB_AKHWAT', 'TPQ'] },
                  tahun: { type: 'integer', example: 2026 },
                  foto: { type: 'array', items: { type: 'string', format: 'binary' } },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Foto berhasil diunggah' } },
      },
    },
    '/api/pendidikan/foto/{id}': {
      put: {
        tags: ['Pendidikan'],
        summary: 'Update foto pendidikan (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: { type: 'object', properties: { judul: { type: 'string' }, foto: { type: 'string', format: 'binary' } } },
            },
          },
        },
        responses: { 200: { description: 'Foto diperbarui' } },
      },
      delete: {
        tags: ['Pendidikan'],
        summary: 'Hapus foto pendidikan (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Foto dihapus' } },
      },
    },
    '/api/pendidikan/{kategori}': {
      get: {
        tags: ['Pendidikan'],
        summary: 'Info & foto pendidikan by kategori (public)',
        parameters: [
          { name: 'kategori', in: 'path', required: true, schema: { type: 'string', enum: ['TAHSIN_IKHWAN', 'TAHSIN_AKHWAT', 'BAHASA_ARAB_IKHWAN', 'BAHASA_ARAB_AKHWAT', 'TPQ'] } },
        ],
        responses: { 200: { description: 'Info dan foto pendidikan' } },
      },
    },

    // ── USAHA ────────────────────────────────────────────────────────────────
    '/api/usaha/umroh/admin': {
      get: {
        tags: ['Usaha'],
        summary: 'Semua flyer umroh (admin)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Daftar flyer umroh' } },
      },
    },
    '/api/usaha/umroh': {
      get: {
        tags: ['Usaha'],
        summary: 'Flyer umroh aktif (public)',
        responses: { 200: { description: 'Daftar flyer umroh', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Umroh' } } } } } },
      },
      post: {
        tags: ['Usaha'],
        summary: 'Upload flyer umroh — bisa sekaligus banyak (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  judul: { type: 'string', description: 'Opsional jika batch' },
                  flyer: { type: 'array', items: { type: 'string', format: 'binary' } },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Flyer berhasil diunggah' } },
      },
    },
    '/api/usaha/umroh/{id}': {
      put: {
        tags: ['Usaha'],
        summary: 'Update flyer umroh (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: { type: 'object', properties: { judul: { type: 'string' }, flyer: { type: 'string', format: 'binary' } } },
            },
          },
        },
        responses: { 200: { description: 'Flyer diperbarui' } },
      },
      delete: {
        tags: ['Usaha'],
        summary: 'Hapus flyer umroh (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Flyer dihapus' } },
      },
    },
    '/api/usaha/mart/admin': {
      get: {
        tags: ['Usaha'],
        summary: 'Semua produk MIAS Mart (admin)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Daftar produk' } },
      },
    },
    '/api/usaha/mart': {
      get: {
        tags: ['Usaha'],
        summary: 'Produk MIAS Mart (public)',
        responses: { 200: { description: 'Daftar produk', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/MiasMart' } } } } } },
      },
      post: {
        tags: ['Usaha'],
        summary: 'Tambah produk MIAS Mart — bisa sekaligus banyak foto (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['harga'],
                properties: {
                  nama: { type: 'string' },
                  harga: { type: 'number', example: 150000 },
                  deskripsi: { type: 'string' },
                  foto: { type: 'array', items: { type: 'string', format: 'binary' } },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Produk ditambahkan' } },
      },
    },
    '/api/usaha/mart/{id}': {
      put: {
        tags: ['Usaha'],
        summary: 'Update produk MIAS Mart (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  nama: { type: 'string' },
                  harga: { type: 'number' },
                  deskripsi: { type: 'string' },
                  foto: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Produk diperbarui' } },
      },
      delete: {
        tags: ['Usaha'],
        summary: 'Hapus produk MIAS Mart (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Produk dihapus' } },
      },
    },

    // ── QURBAN ───────────────────────────────────────────────────────────────
    '/api/qurban': {
      get: {
        tags: ['Qurban'],
        summary: 'Foto qurban (public)',
        parameters: [
          { name: 'tahun', in: 'query', schema: { type: 'integer', example: 2026 } },
        ],
        responses: { 200: { description: 'Daftar foto qurban', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Qurban' } } } } } },
      },
      post: {
        tags: ['Qurban'],
        summary: 'Upload foto qurban — bisa sekaligus banyak (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['tahun'],
                properties: {
                  judul: { type: 'string', description: 'Opsional jika batch' },
                  tahun: { type: 'integer', example: 2026 },
                  foto: { type: 'array', items: { type: 'string', format: 'binary' } },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Foto berhasil diunggah' } },
      },
    },
    '/api/qurban/admin/all': {
      get: {
        tags: ['Qurban'],
        summary: 'Semua foto qurban (admin)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Semua foto qurban' } },
      },
    },
    '/api/qurban/{id}': {
      put: {
        tags: ['Qurban'],
        summary: 'Update foto qurban (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  judul: { type: 'string' },
                  tahun: { type: 'integer' },
                  foto: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Foto diperbarui' } },
      },
      delete: {
        tags: ['Qurban'],
        summary: 'Hapus foto qurban (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Foto dihapus' } },
      },
    },

    // ── PROFIL ───────────────────────────────────────────────────────────────
    '/api/profil/sejarah': {
      get: { tags: ['Profil'], summary: 'Sejarah masjid (public)', responses: { 200: { description: 'Konten sejarah', content: { 'application/json': { schema: { $ref: '#/components/schemas/Sejarah' } } } } } },
      put: {
        tags: ['Profil'], summary: 'Update sejarah (admin)', security: [{ bearerAuth: [] }],
        requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', properties: { konten: { type: 'string' }, foto: { type: 'string', format: 'binary' } } } } } },
        responses: { 200: { description: 'Sejarah diperbarui' } },
      },
    },
    '/api/profil/visi-misi': {
      get: { tags: ['Profil'], summary: 'Visi misi masjid (public)', responses: { 200: { description: 'Visi misi', content: { 'application/json': { schema: { $ref: '#/components/schemas/VisiMisi' } } } } } },
      put: {
        tags: ['Profil'], summary: 'Update visi misi (admin)', security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { visi: { type: 'string' }, misi: { type: 'string' } } } } } },
        responses: { 200: { description: 'Visi misi diperbarui' } },
      },
    },
    '/api/profil/fasilitas': {
      get: { tags: ['Profil'], summary: 'Daftar fasilitas masjid (public)', responses: { 200: { description: 'Daftar fasilitas', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Fasilitas' } } } } } } },
      post: {
        tags: ['Profil'], summary: 'Tambah fasilitas (admin)', security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['nama'], properties: { nama: { type: 'string' }, deskripsi: { type: 'string' } } } } } },
        responses: { 201: { description: 'Fasilitas ditambahkan' } },
      },
    },
    '/api/profil/fasilitas/admin': {
      get: { tags: ['Profil'], summary: 'Semua fasilitas (admin)', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Semua fasilitas' } } },
    },
    '/api/profil/fasilitas/{id}': {
      put: {
        tags: ['Profil'], summary: 'Update fasilitas (admin)', security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { nama: { type: 'string' }, deskripsi: { type: 'string' } } } } } },
        responses: { 200: { description: 'Fasilitas diperbarui' } },
      },
      delete: {
        tags: ['Profil'], summary: 'Hapus fasilitas (admin)', security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Fasilitas dihapus' } },
      },
    },
    '/api/profil/fasilitas/{id}/foto': {
      post: {
        tags: ['Profil'], summary: 'Tambah foto fasilitas (admin)', security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', properties: { foto: { type: 'string', format: 'binary' } } } } } },
        responses: { 201: { description: 'Foto ditambahkan' } },
      },
    },
    '/api/profil/fasilitas/foto/{fotoId}': {
      delete: {
        tags: ['Profil'], summary: 'Hapus foto fasilitas (admin)', security: [{ bearerAuth: [] }],
        parameters: [{ name: 'fotoId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Foto dihapus' } },
      },
    },
    '/api/profil/struktur': {
      get: { tags: ['Profil'], summary: 'Struktur organisasi masjid (public)', responses: { 200: { description: 'Struktur organisasi' } } },
      put: {
        tags: ['Profil'], summary: 'Update struktur organisasi (admin)', security: [{ bearerAuth: [] }],
        requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', properties: { konten: { type: 'string' }, foto: { type: 'string', format: 'binary' } } } } } },
        responses: { 200: { description: 'Struktur diperbarui' } },
      },
    },
    '/api/profil/pemateri': {
      get: { tags: ['Profil'], summary: 'Daftar pemateri aktif (public)', responses: { 200: { description: 'Daftar pemateri', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Pemateri' } } } } } } },
      post: {
        tags: ['Profil'], summary: 'Tambah pemateri (admin)', security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', required: ['nama'], properties: { nama: { type: 'string' }, bidang: { type: 'string' }, bio: { type: 'string' }, foto: { type: 'string', format: 'binary' } } } } } },
        responses: { 201: { description: 'Pemateri ditambahkan' } },
      },
    },
    '/api/profil/pemateri/admin': {
      get: { tags: ['Profil'], summary: 'Semua pemateri (admin)', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Semua pemateri' } } },
    },
    '/api/profil/pemateri/{id}': {
      put: {
        tags: ['Profil'], summary: 'Update pemateri (admin)', security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', properties: { nama: { type: 'string' }, bidang: { type: 'string' }, bio: { type: 'string' }, foto: { type: 'string', format: 'binary' } } } } } },
        responses: { 200: { description: 'Pemateri diperbarui' } },
      },
      delete: {
        tags: ['Profil'], summary: 'Hapus pemateri (admin)', security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Pemateri dihapus' } },
      },
    },

    // ── SETTING ───────────────────────────────────────────────────────────────
    '/api/setting': {
      get: { tags: ['Setting'], summary: 'Baca pengaturan sosial media & info kontak (public)', responses: { 200: { description: 'Data setting', content: { 'application/json': { schema: { $ref: '#/components/schemas/Setting' } } } } } },
      put: {
        tags: ['Setting'], summary: 'Update pengaturan (admin)', security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Setting' } } } },
        responses: { 200: { description: 'Setting diperbarui' } },
      },
    },

    // ── PESAN ─────────────────────────────────────────────────────────────────
    '/api/pesan': {
      get: {
        tags: ['Pesan'],
        summary: 'Semua pesan masuk (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['BELUM_DITINDAKLANJUTI', 'SUDAH_DITINDAKLANJUTI'] } },
        ],
        responses: { 200: { description: 'Daftar pesan' } },
      },
      post: {
        tags: ['Pesan'],
        summary: 'Kirim pesan/pertanyaan (public)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nama', 'email', 'noHp', 'kategori', 'pesan'],
                properties: {
                  nama: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  noHp: { type: 'string' },
                  kategori: { type: 'string', enum: ['FASILITAS', 'DIVISI_DAKWAH', 'DIVISI_PENDIDIKAN', 'DIVISI_SOSIAL', 'UMROH', 'PEMBELIAN_PRODUK_MIAS_MART', 'LAIN_LAIN'] },
                  pesan: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Pesan berhasil dikirim' },
          400: { description: 'Validasi gagal' },
        },
      },
    },
    '/api/pesan/summary': {
      get: {
        tags: ['Pesan'],
        summary: 'Ringkasan statistik pesan (admin)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Ringkasan pesan' } },
      },
    },
    '/api/pesan/{id}/status': {
      put: {
        tags: ['Pesan'],
        summary: 'Update status pesan (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: { status: { type: 'string', enum: ['BELUM_DITINDAKLANJUTI', 'SUDAH_DITINDAKLANJUTI'] } },
              },
            },
          },
        },
        responses: { 200: { description: 'Status pesan diperbarui' } },
      },
    },

    // ── YOUTUBE ───────────────────────────────────────────────────────────────
    '/api/youtube/videos': {
      get: {
        tags: ['YouTube'],
        summary: 'Daftar video YouTube dari channel MIAS (public)',
        parameters: [
          { name: 'maxResults', in: 'query', schema: { type: 'integer', default: 12, maximum: 50 }, description: 'Jumlah video yang ditampilkan (maks 50)' },
          { name: 'pageToken', in: 'query', schema: { type: 'string' }, description: 'Token halaman berikutnya dari YouTube Data API' },
        ],
        responses: {
          200: { description: 'Daftar video YouTube', content: { 'application/json': { example: { success: true, items: [], nextPageToken: null, totalResults: 0 } } } },
        },
      },
    },
    '/api/youtube/live': {
      get: {
        tags: ['YouTube'],
        summary: 'Cek apakah channel sedang live (public, cache 15 menit)',
        responses: {
          200: { description: 'null jika tidak ada live', content: { 'application/json': { example: { success: true, data: null } } } },
        },
      },
    },
  },

  tags: [
    { name: 'System', description: 'Health check & info server' },
    { name: 'Auth', description: 'Autentikasi admin — login, profil, ganti password' },
    { name: 'Kajian', description: 'Jadwal kajian & pengajian' },
    { name: 'Artikel', description: 'Artikel berita & konten dakwah' },
    { name: 'Donasi', description: 'Program donasi, rekening, dan manajemen donatur' },
    { name: 'Galeri', description: 'Foto galeri Ramadhan & Sholat Ied' },
    { name: 'Streaming', description: 'URL live streaming masjid' },
    { name: 'Program Sosial', description: 'Dokumentasi foto program sosial kemasyarakatan' },
    { name: 'Pendidikan', description: 'Program pendidikan masjid (Tahsin, Bahasa Arab, TPQ)' },
    { name: 'Qurban', description: 'Dokumentasi foto kegiatan Qurban' },
    { name: 'Usaha', description: 'Usaha masjid — Umroh & MIAS Mart' },
    { name: 'Profil', description: 'Profil masjid — sejarah, visi misi, fasilitas, struktur, pemateri' },
    { name: 'Setting', description: 'Pengaturan sosial media & info kontak masjid' },
    { name: 'Pesan', description: 'Pesan / pertanyaan dari pengunjung website' },
    { name: 'YouTube', description: 'Integrasi YouTube Data API v3' },
  ],
};

module.exports = swaggerDocument;
