import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ImagePlus,
  Paperclip,
  Plus,
  X
} from "lucide-react";

import {
  createProduct,
  fetchSingleProduct,
  updateProduct
} from "../../api/productApi";

import { fetchCategories } from "../../api/adminApi";
import { getErrorMessage } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import PageLoader from "../../components/common/Loader";


const emptyForm = {
  name: "",
  description: "",
  price: "",
  category: "",
  stock: "",
  colors: [],
  variants: [],
};


const MAX_IMAGES = 10;


export default function AdminProductForm() {

  const { productId } = useParams();

  const isEdit =
    Boolean(productId);

  const navigate =
    useNavigate();

  const toast =
    useToast();


  const [form, setForm] =
    useState(emptyForm);

  const [files, setFiles] =
    useState([]);

  const [previews, setPreviews] =
    useState([]);

  const [existing, setExisting] =
    useState([]);

  const [categories, setCategories] =
    useState([]);

  const [loading, setLoading] =
    useState(isEdit);

  const [saving, setSaving] =
    useState(false);


  // Categories
  useEffect(() => {

    fetchCategories()
      .then((res) =>
        setCategories(
          (res.categories || [])
            .map((c) => c.name)
        )
      )
      .catch(() =>
        setCategories([])
      );

  }, []);


  // Fetch product for editing
  useEffect(() => {

    if (!isEdit) {
      return;
    }

    setLoading(true);


    fetchSingleProduct(productId)

      .then((res) => {

        const p =
          res.product;


        setForm({

          name:
            p.name || "",

          description:
            p.description || "",

          price:
            String(p.price ?? ""),

          category:
            p.category || "",

          stock:
            String(p.stock ?? ""),


          colors: (
            Array.isArray(p.colors) &&
            p.colors.length

              ? p.colors

              : p.color
                ? [{
                    name: p.color,
                    price:
                      Number(p.price) || 0,
                    image: null
                  }]

                : []
          ).map((c) => ({

            name:
              c.name,

            price:
              c.price,

            image:
              c.image || null,

            file:
              null,

            preview:
              null,
          })),


          variants:
            Array.isArray(p.variants)
              ? p.variants
              : [],
        });


        setExisting(
          Array.isArray(p.images)
            ? p.images
            : []
        );
      })

      .catch((err) => {

        toast.error(
          getErrorMessage(
            err,
            "Product not found"
          )
        );

        navigate(
          "/admin/products"
        );
      })

      .finally(() =>
        setLoading(false)
      );

  }, [
    productId,
    isEdit,
    navigate,
    toast
  ]);


  // Select normal product images
  const onFiles = (e) => {

    const selected =
      Array.from(
        e.target.files || []
      );

    e.target.value = "";


    const room =
      MAX_IMAGES -
      existing.length -
      files.length;


    if (selected.length > room) {

      toast.error(

        room > 0

          ? `Only ${room} more image(s) allowed (max ${MAX_IMAGES})`

          : `Maximum ${MAX_IMAGES} images per product`
      );
    }


    const accepted =
      selected.slice(
        0,
        Math.max(0, room)
      );


    if (!accepted.length) {
      return;
    }


    const next = [
      ...files,
      ...accepted
    ];


    setFiles(next);


    setPreviews(
      next.map((file) =>
        URL.createObjectURL(file)
      )
    );
  };


  // Remove newly selected image
  const removeNewFile = (index) => {

    setFiles((prev) =>
      prev.filter(
        (_, i) => i !== index
      )
    );


    setPreviews((prev) => {

      const target =
        prev[index];

      if (target) {
        URL.revokeObjectURL(target);
      }

      return prev.filter(
        (_, i) => i !== index
      );
    });
  };


  // Remove existing image
  const removeExistingImage = (index) => {

    setExisting((prev) =>
      prev.filter(
        (_, i) => i !== index
      )
    );
  };


  const updateOption = (
    listName,
    index,
    field,
    value
  ) =>

    setForm((prev) => ({

      ...prev,

      [listName]:
        prev[listName].map(
          (entry, i) =>
            i === index
              ? {
                  ...entry,
                  [field]: value
                }
              : entry
        ),
    }));


  const addOption = (
    listName,
    empty
  ) =>

    setForm((prev) => ({

      ...prev,

      [listName]: [
        ...prev[listName],
        empty
      ],
    }));


  const removeOption = (
    listName,
    index
  ) =>

    setForm((prev) => ({

      ...prev,

      [listName]:
        prev[listName].filter(
          (_, i) => i !== index
        ),
    }));


  // Attach color image
  const attachColorFile = (
    index,
    file
  ) => {

    if (!file) {
      return;
    }


    if (
      !file.type.startsWith(
        "image/"
      )
    ) {

      toast.error(
        "Only image files are allowed"
      );

      return;
    }


    if (
      file.size >
      1024 * 1024
    ) {

      toast.error(
        "Color image must be 1MB or smaller"
      );

      return;
    }


    setForm((prev) => ({

      ...prev,

      colors:
        prev.colors.map(
          (c, i) => {

            if (i !== index) {
              return c;
            }


            if (
              c.file &&
              c.preview
            ) {
              URL.revokeObjectURL(
                c.preview
              );
            }


            return {
              ...c,

              file,

              preview:
                URL.createObjectURL(
                  file
                )
            };
          }
        ),
    }));
  };


  // Clear color image
  const clearColorAttachment = (
    index
  ) => {

    setForm((prev) => ({

      ...prev,

      colors:
        prev.colors.map(
          (c, i) => {

            if (i !== index) {
              return c;
            }


            if (
              c.file &&
              c.preview
            ) {
              URL.revokeObjectURL(
                c.preview
              );
            }


            return {
              ...c,

              file: null,
              preview: null,
              image: null
            };
          }
        ),
    }));
  };


  // Remove color
  const removeColorOption = (
    index
  ) => {

    setForm((prev) => {

      const target =
        prev.colors[index];


      if (
        target?.file &&
        target.preview
      ) {

        URL.revokeObjectURL(
          target.preview
        );
      }


      return {

        ...prev,

        colors:
          prev.colors.filter(
            (_, i) =>
              i !== index
          ),
      };
    });
  };


  // Submit
  const submit = async (e) => {

    e.preventDefault();


    const hasColorPicture =
      form.colors.some(
        (c) =>
          c.name.trim() &&
          String(c.price) !== "" &&
          (
            c.file ||
            c.image?.url
          )
      );


    if (
      existing.length === 0 &&
      files.length === 0 &&
      !hasColorPicture
    ) {

      toast.error(
        "Add at least one product image or a color picture"
      );

      return;
    }


    setSaving(true);


    try {

      const formData =
        new FormData();


      formData.append(
        "name",
        form.name
      );

      formData.append(
        "description",
        form.description
      );

      formData.append(
        "price",
        String(
          Number(form.price)
        )
      );

      formData.append(
        "category",
        form.category
      );

      formData.append(
        "stock",
        String(
          Number(form.stock)
        )
      );


      // Colors
      const colorEntries = [];
      const colorFiles = [];


      for (const c of form.colors) {

        if (
          !c.name.trim() ||
          String(c.price) === ""
        ) {
          continue;
        }


        const entry = {

          name:
            c.name.trim(),

          price:
            Number(c.price),

          image:
            c.image || null,

          hasNewImage:
            false,
        };


        if (c.file) {

          entry.hasNewImage =
            true;

          entry.image =
            null;

          colorFiles.push(
            c.file
          );
        }


        colorEntries.push(
          entry
        );
      }


      // Variants
      const cleanVariants =
        form.variants

          .filter(
            (v) =>
              v.label.trim() &&
              String(v.price) !== ""
          )

          .map((v) => ({

            label:
              v.label.trim(),

            price:
              Number(v.price)
          }));


      formData.append(
        "colors",
        JSON.stringify(
          colorEntries
        )
      );


      formData.append(
        "variants",
        JSON.stringify(
          cleanVariants
        )
      );


      colorFiles.forEach(
        (file) =>
          formData.append(
            "color_images",
            file
          )
      );


      /*
       * IMPORTANT
       *
       * Cloudinary image:
       * public_id
       *
       * Seeded / external image:
       * url
       */
      if (isEdit) {

        const existingImageIdentifiers =
          existing
            .map(
              (img) =>
                img.public_id ||
                img.url
            )
            .filter(Boolean);


        formData.append(
          "existing_images",
          JSON.stringify(
            existingImageIdentifiers
          )
        );
      }


      // New normal images
      files.forEach(
        (file) =>
          formData.append(
            "images",
            file
          )
      );


      const res =
        isEdit

          ? await updateProduct(
              productId,
              formData
            )

          : await createProduct(
              formData
            );


      toast.success(
        res.message
      );


      navigate(
        "/admin/products"
      );


    } catch (err) {

      toast.error(
        getErrorMessage(
          err,
          "Could not save product"
        )
      );

    } finally {

      setSaving(false);
    }
  };


  if (loading) {

    return (
      <PageLoader
        label="Loading product..."
      />
    );
  }


  return (

    <div>

      <Breadcrumbs
        items={[
          {
            label: "Product",
            to: "/admin/products"
          },
          {
            label:
              isEdit
                ? "Edit Product"
                : "New Product"
          },
        ]}
      />


      <form
        onSubmit={submit}
        className="admin-card p-6"
      >

        <h2 className="mb-6 border-b border-gray-100 pb-4 text-xl font-bold dark:border-gray-800">

          {isEdit
            ? "Edit Product"
            : "New Product"}

        </h2>


        <div className="grid gap-5 sm:grid-cols-2">

          {/* Name */}
          <div>

            <label className="label">
              Name{" "}
              <span className="text-red-500">
                *
              </span>
            </label>

            <input
              className="admin-input"
              required
              placeholder="Product name"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name:
                    e.target.value
                })
              }
            />

          </div>


          {/* Category */}
          <div>

            <label className="label">
              Category{" "}
              <span className="text-red-500">
                *
              </span>
            </label>


            <select
              className="admin-input"
              required
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category:
                    e.target.value
                })
              }
            >

              <option
                value=""
                disabled
              >
                Select category
              </option>


              {(
                form.category &&
                !categories.includes(
                  form.category
                )

                  ? [
                      ...categories,
                      form.category
                    ]

                  : categories
              ).map((c) => (

                <option
                  key={c}
                  value={c}
                >
                  {c}
                </option>

              ))}

            </select>

          </div>


          {/* Price */}
          <div>

            <label className="label">
              Price{" "}
              <span className="text-red-500">
                *
              </span>
            </label>


            <input
              type="number"
              min="0"
              className="admin-input"
              required
              placeholder="0"
              value={form.price}
              onChange={(e) =>
                setForm({
                  ...form,
                  price:
                    e.target.value
                })
              }
            />

          </div>


          {/* Stock */}
          <div>

            <label className="label">
              Stock{" "}
              <span className="text-red-500">
                *
              </span>
            </label>


            <input
              type="number"
              min="0"
              className="admin-input"
              required
              placeholder="0"
              value={form.stock}
              onChange={(e) =>
                setForm({
                  ...form,
                  stock:
                    e.target.value
                })
              }
            />

          </div>


          {/* Colors */}
          <div className="sm:col-span-2">

            <label className="label">
              Colors
            </label>


            <div className="space-y-2">

              {form.colors.map(
                (c, i) => {

                  const thumb =
                    c.preview ||
                    c.image?.url ||
                    null;


                  return (

                    <div
                      key={i}
                      className="flex items-center gap-2"
                    >

                      <input
                        className="admin-input min-w-0 flex-1"
                        placeholder="Color name (eg: Black)"
                        value={c.name}
                        onChange={(e) =>
                          updateOption(
                            "colors",
                            i,
                            "name",
                            e.target.value
                          )
                        }
                      />


                      <input
                        type="number"
                        min="0"
                        className="admin-input w-32"
                        placeholder="Price"
                        value={c.price}
                        onChange={(e) =>
                          updateOption(
                            "colors",
                            i,
                            "price",
                            e.target.value
                          )
                        }
                      />


                      <label
                        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 text-gray-400 transition hover:border-brand-600 hover:text-brand-700 dark:border-gray-700"
                        title="Attach color picture"
                      >

                        <Paperclip
                          size={14}
                        />


                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={(e) => {

                            attachColorFile(
                              i,
                              e.target.files?.[0]
                            );

                            e.target.value =
                              "";
                          }}
                        />

                      </label>


                      {thumb ? (

                        <span className="relative shrink-0">

                          <img
                            src={thumb}
                            alt=""
                            className="h-9 w-9 rounded-lg border border-gray-100 object-cover dark:border-gray-700"
                          />


                          <button
                            type="button"
                            onClick={() =>
                              clearColorAttachment(
                                i
                              )
                            }
                            className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gray-700 text-white transition hover:bg-red-600"
                            aria-label="Remove attachment"
                          >

                            <X size={10} />

                          </button>

                        </span>

                      ) : null}


                      <button
                        type="button"
                        onClick={() =>
                          removeColorOption(
                            i
                          )
                        }
                        className="shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-gray-400 transition hover:border-red-300 hover:text-red-600 dark:border-gray-700"
                        aria-label="Remove color"
                      >

                        <X size={15} />

                      </button>

                    </div>
                  );
                }
              )}


              {form.colors.length === 0 ? (

                <p className="text-xs text-gray-400">
                  No colors added yet.
                </p>

              ) : null}

            </div>


            <button
              type="button"
              onClick={() =>
                addOption(
                  "colors",
                  {
                    name: "",
                    price: ""
                  }
                )
              }
              className="btn-outline mt-3"
            >

              <Plus size={14} />
              Add Color

            </button>

          </div>


          {/* Variants */}
          <div className="sm:col-span-2">

            <label className="label">
              Variants
            </label>


            <div className="space-y-2">

              {form.variants.map(
                (v, i) => (

                  <div
                    key={i}
                    className="flex gap-2"
                  >

                    <input
                      className="admin-input flex-1"
                      placeholder="Variant (eg: 8/128)"
                      value={v.label}
                      onChange={(e) =>
                        updateOption(
                          "variants",
                          i,
                          "label",
                          e.target.value
                        )
                      }
                    />


                    <input
                      type="number"
                      min="0"
                      className="admin-input w-40"
                      placeholder="Price"
                      value={v.price}
                      onChange={(e) =>
                        updateOption(
                          "variants",
                          i,
                          "price",
                          e.target.value
                        )
                      }
                    />


                    <button
                      type="button"
                      onClick={() =>
                        removeOption(
                          "variants",
                          i
                        )
                      }
                      className="rounded-lg border border-gray-200 px-3 text-gray-400 transition hover:border-red-300 hover:text-red-600 dark:border-gray-700"
                      aria-label="Remove variant"
                    >

                      <X size={15} />

                    </button>

                  </div>
                )
              )}


              {form.variants.length === 0 ? (

                <p className="text-xs text-gray-400">
                  No variants added yet.
                </p>

              ) : null}

            </div>


            <button
              type="button"
              onClick={() =>
                addOption(
                  "variants",
                  {
                    label: "",
                    price: ""
                  }
                )
              }
              className="btn-outline mt-3"
            >

              <Plus size={14} />
              Add Variant

            </button>


            <p className="mt-2 text-xs text-gray-400">

              Final price = variant price +
              (color price − product price).

            </p>

          </div>


          {/* Description */}
          <div className="sm:col-span-2">

            <label className="label">

              Product Description{" "}

              <span className="text-red-500">
                *
              </span>

            </label>


            <textarea
              className="admin-input min-h-[120px]"
              required
              placeholder="Describe the product..."
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description:
                    e.target.value
                })
              }
            />

          </div>

        </div>


        {/* Images */}
        <div className="mt-5">

          <label className="label">
            Images (max {MAX_IMAGES},
            single or multiple)
          </label>


          {(
            existing.length > 0 ||
            previews.length > 0
          ) ? (

            <div className="mb-3 flex flex-wrap gap-3">


              {/* Existing images */}
              {existing.map(
                (img, i) => (

                  <div
                    key={
                      img.public_id ||
                      img.url ||
                      i
                    }
                    className="relative"
                  >

                    <img
                      src={img.url}
                      alt=""
                      className="h-24 w-24 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                    />


                    <span className="absolute left-1 top-1 rounded-full bg-gray-800 px-1.5 py-0.5 text-[9px] text-white">

                      current

                    </span>


                    <button
                      type="button"
                      onClick={() =>
                        removeExistingImage(
                          i
                        )
                      }
                      className="absolute -right-2 -top-2 rounded-full bg-red-600 p-1 text-white transition hover:bg-red-700"
                      aria-label="Remove image"
                    >

                      <X size={12} />

                    </button>

                  </div>
                )
              )}


              {/* New images */}
              {previews.map(
                (src, i) => (

                  <div
                    key={src}
                    className="relative"
                  >

                    <img
                      src={src}
                      alt=""
                      className="h-24 w-24 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                    />


                    <span className="absolute left-1 top-1 rounded-full bg-admin-600 px-1.5 py-0.5 text-[9px] text-white">

                      new

                    </span>


                    <button
                      type="button"
                      onClick={() =>
                        removeNewFile(
                          i
                        )
                      }
                      className="absolute -right-2 -top-2 rounded-full bg-red-600 p-1 text-white transition hover:bg-red-700"
                      aria-label="Remove image"
                    >

                      <X size={12} />

                    </button>

                  </div>
                )
              )}

            </div>

          ) : null}


          <label className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center transition hover:border-admin-500 dark:border-gray-700 dark:bg-gray-900/50">

            <ImagePlus
              size={26}
              className="text-gray-400"
            />


            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">

              Click to select product images

            </span>


            <span className="text-xs text-gray-400">

              PNG, JPG, WEBP or GIF
              up to 1 MB each —{" "}

              {MAX_IMAGES -
                existing.length -
                files.length}{" "}

              slot(s) left

            </span>


            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onFiles}
            />

          </label>


          <p className="mt-2 text-xs text-gray-400">

            Removing an image here keeps it in Media.
            It is deleted permanently (and from
            Cloudinary) only when removed from the
            Media page.

          </p>

        </div>


        {/* Actions */}
        <div className="mt-6 flex gap-3">

          <button
            type="submit"
            disabled={saving}
            className="btn-admin"
          >

            {saving
              ? "Saving..."
              : "Submit"}

          </button>


          <button
            type="button"
            onClick={() =>
              navigate(
                "/admin/products"
              )
            }
            className="btn-outline"
          >

            Cancel

          </button>

        </div>

      </form>

    </div>
  );
}